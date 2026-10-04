import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { filter, interval } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CashOpenDialog, CashOpenData } from '../components/cash-session-dialogs/cash-open-dialog';
import { CashSessionCloseData, CashSessionCloseDialog } from '../components/cash-session-dialogs/cash-session-close-dialog';
import { CashSessionDetailDialog } from '../components/cash-session-dialogs/cash-session-detail-dialog';
import {
  CashSession, CashSessionApiService, StoreCashStatus, cashErrorMessage,
} from '../data-access/cash-session-api.service';

const REFRESH_MS = 30_000;

@Component({
  selector: 'app-cash-register-page',
  imports: [PageHeader, RouterLink, DatePipe],
  templateUrl: './cash-register-page.html',
  styleUrl: './cash-register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashRegisterPage implements OnInit {
  private readonly api = inject(CashSessionApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly user = inject(UserContextService).user();
  readonly isAdmin = this.user?.role === 'ADMIN';

  readonly statuses = signal<readonly StoreCashStatus[]>([]);
  readonly statusLoading = signal(true);
  readonly statusError = signal<string | null>(null);

  readonly history = signal<readonly CashSession[]>([]);
  readonly historyLoading = signal(true);
  readonly from = signal('');
  readonly to = signal('');
  readonly storeFilter = signal('');

  readonly openCount = computed(() => this.statuses().filter((s) => s.current).length);

  ngOnInit(): void {
    this.loadStatus();
    this.loadHistory();
    interval(REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStatus(true));
  }

  loadStatus(silent = false): void {
    if (!silent) this.statusLoading.set(true);
    this.api.status().subscribe({
      next: (rows) => {
        this.statuses.set(rows);
        this.statusError.set(null);
        this.statusLoading.set(false);
      },
      error: (cause: unknown) => {
        this.statusLoading.set(false);
        this.statusError.set(cashErrorMessage(cause, 'No se pudo cargar el estado de la caja.'));
      },
    });
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.api
      .list({ storeId: this.storeFilter() || undefined, from: this.from() || undefined, to: this.to() || undefined })
      .subscribe({
        next: (rows) => {
          this.history.set(rows);
          this.historyLoading.set(false);
        },
        error: () => this.historyLoading.set(false),
      });
  }

  isMine(session: CashSession): boolean {
    return session.openedByUserId === this.user?.userId;
  }

  canClose(session: CashSession): boolean {
    return this.isMine(session) || this.isAdmin;
  }

  open(status: StoreCashStatus): void {
    this.dialog
      .open<CashOpenDialog, CashOpenData, CashSession>(CashOpenDialog, {
        data: { storeId: status.storeId, storeName: status.storeName, pendingSales: status.pendingSales },
      })
      .afterClosed()
      .pipe(filter((session): session is CashSession => !!session))
      .subscribe((session) => {
        this.notifications.show(`Caja de ${session.storeName} abierta.`, 'success');
        this.refresh();
      });
  }

  close(session: CashSession): void {
    this.dialog
      .open<CashSessionCloseDialog, CashSessionCloseData, CashSession>(CashSessionCloseDialog, {
        data: { session, forced: !this.isMine(session) },
      })
      .afterClosed()
      .pipe(filter((closed): closed is CashSession => !!closed))
      .subscribe((closed) => {
        const difference = closed.difference ?? 0;
        this.notifications.show(
          `Caja cerrada: diferencia S/ ${difference.toFixed(2)}.`,
          difference === 0 ? 'success' : 'warning',
        );
        this.refresh();
      });
  }

  detail(session: CashSession): void {
    this.dialog.open(CashSessionDetailDialog, { data: session.id });
  }

  clearFilters(): void {
    this.from.set('');
    this.to.set('');
    this.storeFilter.set('');
    this.loadHistory();
  }

  private refresh(): void {
    this.loadStatus(true);
    this.loadHistory();
  }
}

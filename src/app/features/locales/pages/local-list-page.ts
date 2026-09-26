import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { LocalFormDialog } from '../components/local-form-dialog/local-form-dialog';
import { StoreApiService } from '../data-access/store-api.service';
import { Store, StoreFormValue, StorePlanLimit } from '../models/local.model';

@Component({
  selector: 'app-local-list-page',
  imports: [PageHeader, StatusChip],
  templateUrl: './local-list-page.html',
  styleUrl: './local-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalListPage implements OnInit {
  private readonly api = inject(StoreApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly locals = signal<readonly Store[]>([]);
  readonly planLimit = signal<StorePlanLimit>({ used: 0, total: null, planName: null });

  readonly remaining = computed(() => {
    const limit = this.planLimit();
    return limit.total == null ? null : Math.max(0, limit.total - this.locals().length);
  });
  readonly canAdd = computed(() => this.remaining() === null || (this.remaining() as number) > 0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (response) => {
        this.locals.set(response.items);
        this.planLimit.set(response.limit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (!this.canAdd()) {
      this.notifications.show(
        `Alcanzaste el límite de ${this.planLimit().total} locales del plan ${this.planLimit().planName}.`,
        'plan-limit',
      );
      return;
    }
    this.openForm(null);
  }

  edit(local: Store): void {
    this.openForm(local);
  }

  /** MOD-AD-03: desactivar (o reactivar) un local mostrando los vendedores afectados. */
  toggleStatus(local: Store): void {
    const deactivate = local.isActive;
    const data: ReviewDialogData = {
      title: deactivate ? 'Desactivar local' : 'Activar local',
      code: 'MOD-AD-03',
      icon: 'storefront',
      meta: [
        { label: 'Local seleccionado', value: local.name },
        { label: 'Vendedores asignados', value: `${local.sellerCount} vendedor(es)` },
      ],
      banner: deactivate
        ? { tone: 'warning', text: 'Los vendedores asignados no podrán operar desde este local una vez sea desactivado.' }
        : { tone: 'info', text: 'El local volverá a estar disponible para ventas e inventario.' },
      confirmLabel: deactivate ? 'Desactivar local' : 'Activar local',
      destructive: deactivate,
    };
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, { data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        const request = deactivate ? this.api.deactivate(local.id, local.version) : this.api.activate(local.id, local.version);
        request.subscribe({
          next: () => {
            this.notifications.show(`Local ${deactivate ? 'desactivado' : 'activado'}.`, 'success');
            this.load();
          },
          error: (cause: unknown) => {
            const message =
              cause instanceof AppHttpError && cause.status === 409
                ? 'El local cambió o alcanzaste el límite de tu plan. Se recargó la lista.'
                : `No se pudo ${deactivate ? 'desactivar' : 'activar'} el local.`;
            this.notifications.show(message, 'error');
            this.load();
          },
        });
      });
  }

  private openForm(local: Store | null): void {
    this.dialog
      .open<LocalFormDialog, Store | null, StoreFormValue>(LocalFormDialog, { data: local })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        const request = local ? this.api.update(local.id, { ...value, version: local.version }) : this.api.create(value);
        request.subscribe({
          next: () => {
            this.notifications.show(`Local ${local ? 'actualizado' : 'habilitado'}.`, 'success');
            this.load();
          },
          error: (cause: unknown) => {
            const message =
              cause instanceof AppHttpError && cause.status === 409
                ? 'Alcanzaste el límite de locales del plan o el registro cambió.'
                : `No se pudo ${local ? 'actualizar' : 'crear'} el local.`;
            this.notifications.show(message, 'error');
            this.load();
          },
        });
      });
  }
}

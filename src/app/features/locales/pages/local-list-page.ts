import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { LocalFormDialog } from '../components/local-form-dialog/local-form-dialog';
import { LOCAL_MOCK, LOCAL_PLAN_LIMIT } from '../data-access/local.mock';
import { LocalFormValue, LocalItem } from '../models/local.model';

@Component({
  selector: 'app-local-list-page',
  imports: [PageHeader, StatusChip],
  templateUrl: './local-list-page.html',
  styleUrl: './local-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalListPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  readonly planLimit = LOCAL_PLAN_LIMIT;
  readonly locals = signal<readonly LocalItem[]>(LOCAL_MOCK);
  readonly remaining = computed(() => Math.max(0, this.planLimit.total - this.locals().length));
  readonly canAdd = computed(() => this.remaining() > 0);

  create(): void {
    if (!this.canAdd()) {
      this.notifications.show(
        `Alcanzaste el límite de ${this.planLimit.total} locales del plan ${this.planLimit.planName}.`,
        'plan-limit',
      );
      return;
    }
    this.openForm(null);
  }

  edit(local: LocalItem): void {
    this.openForm(local);
  }

  private openForm(local: LocalItem | null): void {
    this.dialog
      .open<LocalFormDialog, LocalItem | null, LocalFormValue>(LocalFormDialog, { data: local })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        if (local) {
          this.locals.update((rows) =>
            rows.map((row) =>
              row.id === local.id
                ? { ...row, name: value.name, address: value.address, phone: value.phone, status: value.isActive ? 'ACTIVE' : 'INACTIVE' }
                : row,
            ),
          );
        } else {
          this.locals.update((rows) => [
            ...rows,
            {
              id: crypto.randomUUID(),
              code: `LOC-${String(rows.length + 1).padStart(3, '0')}`,
              name: value.name,
              address: value.address,
              phone: value.phone,
              sellerCount: 0,
              status: value.isActive ? 'ACTIVE' : 'INACTIVE',
            },
          ]);
        }
        this.notifications.show(`Local ${local ? 'actualizado' : 'habilitado'}.`, 'success');
      });
  }
}

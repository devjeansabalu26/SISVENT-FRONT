import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { SALE_DETAIL_MOCK } from '../data-access/sale-detail.mock';

@Component({
  selector: 'app-sale-detail-page',
  imports: [PageHeader, StatusChip, RouterLink],
  templateUrl: './sale-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './sale-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly sale = SALE_DETAIL_MOCK;

  annul(): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Anular venta',
          message: `Está a punto de anular la venta ${this.sale.number} por S/ ${this.sale.total.toFixed(2)}. Esta acción revertirá el stock de los productos.`,
          confirmLabel: 'Anular venta',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Venta anulada. Stock revertido.', 'success'));
  }
}

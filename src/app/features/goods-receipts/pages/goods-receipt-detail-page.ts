import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { formatAmount } from '../../../shared/utils/diff-rows';
import { GoodsReceiptApiService } from '../data-access/goods-receipt-api.service';
import { GoodsReceiptDetail, receiptStatusHint, receiptStatusLabel } from '../models/goods-receipt.model';
import { DateTimePipe, MoneyPipe, RegionalPipe } from '../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-goods-receipt-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, MoneyPipe, DateTimePipe, RegionalPipe],
  templateUrl: './goods-receipt-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './goods-receipt-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptDetailPage implements OnInit {
  private readonly api = inject(GoodsReceiptApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly working = signal(false);
  readonly receipt = signal<GoodsReceiptDetail | null>(null);
  readonly statusLabel = receiptStatusLabel;
  readonly statusHint = receiptStatusHint;

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  receive(receipt: GoodsReceiptDetail): void {
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, {
        data: {
          title: 'Recibir mercadería',
          icon: 'inventory',
          meta: [
            { label: 'Pedido', value: receipt.receiptNumber },
            { label: 'Proveedor', value: receipt.supplierName ?? 'Sin proveedor' },
            { label: 'Local destino', value: receipt.storeName },
          ],
          kpis: [
            { label: 'Productos', value: `${receipt.itemCount} items` },
            { label: 'Unidades', value: `${receipt.totalUnits} unids.` },
            { label: 'Costo total', value: formatAmount(receipt.totalCost) },
          ],
          banner: {
            tone: 'warning',
            text: 'Al recibir, el stock del local sube con estas cantidades y se actualiza el costo de referencia de cada producto. Revisa que lo que llegó coincida con el pedido.',
          },
          confirmLabel: 'Recibir mercadería',
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.run(this.api.receive(receipt.id, true), 'Mercadería recibida: el stock ya está actualizado.'));
  }

  cancelOrder(receipt: GoodsReceiptDetail): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Anular pedido',
          message: `¿Anular el pedido ${receipt.receiptNumber}? Dejará de contarse como "en camino" y el stock no cambia.`,
          cancelLabel: 'No, volver',
          confirmLabel: 'Sí, anular',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.run(this.api.cancelOrder(receipt.id, null), 'Pedido anulado.'));
  }

  private run(request: ReturnType<GoodsReceiptApiService['receive']>, message: string): void {
    this.working.set(true);
    request.subscribe({
      next: (updated) => {
        this.receipt.set(updated);
        this.working.set(false);
        this.notifications.show(message, 'success');
      },
      error: (cause: unknown) => {
        this.working.set(false);
        this.notifications.show(cause instanceof AppHttpError && cause.message ? cause.message : 'No se pudo completar la acción.', 'error');
      },
    });
  }
}

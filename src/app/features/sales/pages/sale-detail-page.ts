import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { SaleApiService } from '../data-access/sale-api.service';
import { SaleDetail } from '../models/sale-detail.model';

@Component({
  selector: 'app-sale-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, DatePipe],
  templateUrl: './sale-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './sale-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailPage implements OnInit {
  private readonly api = inject(SaleApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly isAdmin = inject(UserContextService).user()?.role === 'ADMIN';

  readonly loading = signal(true);
  readonly sale = signal<SaleDetail | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.get(this.id).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  annul(): void {
    const sale = this.sale();
    if (!sale) return;
    const data: ReviewDialogData = {
      title: 'Anular venta',
      icon: 'receipt_long',
      meta: [
        { label: 'Venta', value: sale.saleNumber },
        { label: 'Cliente', value: sale.clientName ?? 'Cliente general' },
        { label: 'Total', value: `S/ ${sale.total.toFixed(2)}` },
      ],
      banner: { tone: 'danger', text: 'Esta acción revertirá el stock de los productos vendidos y no se puede deshacer.' },
      reason: { label: 'Motivo de anulación', placeholder: 'Error en el cobro, devolución del cliente…' },
      confirmLabel: 'Anular venta',
      destructive: true,
    };
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean | string>(ReviewDialog, { data })
      .afterClosed()
      .pipe(filter((reason): reason is string => typeof reason === 'string'))
      .subscribe((reason) => {
        this.api.cancel(sale.id, reason).subscribe({
          next: () => {
            this.notifications.show('Venta anulada. Stock revertido.', 'success');
            this.load();
          },
          error: () => this.notifications.show('No se pudo anular la venta.', 'error'),
        });
      });
  }
}

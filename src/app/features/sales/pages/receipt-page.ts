import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NotificationService } from '../../../core/notifications/notification.service';
import { SALE_DETAIL_MOCK } from '../data-access/sale-detail.mock';

@Component({
  selector: 'app-receipt-page',
  templateUrl: './receipt-page.html',
  styleUrl: './receipt-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptPage {
  private readonly location = inject(Location);
  private readonly notifications = inject(NotificationService);
  readonly sale = SALE_DETAIL_MOCK;
  readonly issuedAt = '01/09/2026 14:35';

  back(): void {
    this.location.back();
  }

  print(): void {
    window.print();
  }

  sendEmail(): void {
    this.notifications.show('Comprobante enviado al correo del cliente.', 'success');
  }

  downloadPdf(): void {
    this.notifications.show('La descarga en PDF se habilita cuando el endpoint esté disponible.', 'info');
  }
}

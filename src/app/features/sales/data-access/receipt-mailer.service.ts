import { Injectable, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { SendReceiptData, SendReceiptDialog } from '../components/send-receipt-dialog/send-receipt-dialog';
import { SaleDetail } from '../models/sale-detail.model';
import { receiptPdfBase64 } from '../utils/receipt-pdf';
import { SaleApiService } from './sale-api.service';

@Injectable({ providedIn: 'root' })
export class ReceiptMailerService {
  private readonly api = inject(SaleApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly company = inject(CompanyContextService).company;

  private readonly sendingState = signal(false);
  readonly sending = this.sendingState.asReadonly();
  readonly companyName = computed(() => this.company()?.commercialName ?? 'SAVIX');

  send(sale: SaleDetail): void {
    if (this.sendingState()) return;
    this.dialog
      .open<SendReceiptDialog, SendReceiptData, string>(SendReceiptDialog, {
        data: { saleNumber: sale.saleNumber, clientName: sale.clientName, clientEmail: sale.clientEmail ?? null },
      })
      .afterClosed()
      .pipe(filter((email): email is string => !!email))
      .subscribe((email) => void this.deliver(sale, email));
  }

  sendTo(sale: SaleDetail, email: string): void {
    if (this.sendingState()) return;
    void this.deliver(sale, email);
  }

  private async deliver(sale: SaleDetail, email: string): Promise<void> {
    this.sendingState.set(true);
    this.notifications.show(`Enviando comprobante a ${email}…`, 'info');
    try {
      const pdf = await receiptPdfBase64(sale, this.companyName());
      this.api.sendReceipt(sale.id, email, pdf).subscribe({
        next: (result) => {
          this.sendingState.set(false);
          this.notifications.show(`Comprobante enviado a ${result.email}.`, 'success');
        },
        error: (cause: unknown) => {
          this.sendingState.set(false);
          this.notifications.show(this.errorMessage(cause), 'error');
        },
      });
    } catch {
      this.sendingState.set(false);
      this.notifications.show('No se pudo generar el PDF del comprobante.', 'error');
    }
  }

  private errorMessage(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      const body = (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error;
      if (typeof body?.title === 'string' && !body.errors && [400, 404, 429, 502, 503].includes(cause.status)) return body.title;
    }
    return 'No se pudo enviar el comprobante por correo.';
  }
}

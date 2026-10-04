import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { SaleApiService } from '../data-access/sale-api.service';
import { SaleDetail } from '../models/sale-detail.model';
import { ReceiptMailerService } from '../data-access/receipt-mailer.service';
import { downloadReceiptPdf } from '../utils/receipt-pdf';

@Component({
  selector: 'app-receipt-page',
  imports: [DatePipe],
  templateUrl: './receipt-page.html',
  styleUrl: './receipt-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptPage implements OnInit {
  private readonly api = inject(SaleApiService);
  private readonly location = inject(Location);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  private readonly company = inject(CompanyContextService).company;

  readonly loading = signal(true);
  readonly downloading = signal(false);
  private readonly mailer = inject(ReceiptMailerService);
  readonly sending = this.mailer.sending;
  readonly companyName = computed(() => this.company()?.commercialName ?? 'SAVIX');
  readonly sale = signal<SaleDetail | null>(null);

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  back(): void {
    this.location.back();
  }

  print(): void {
    window.print();
  }

  /** Envía el comprobante (el mismo PDF que se descarga) al correo del cliente o al que se indique. */
  sendEmail(): void {
    const sale = this.sale();
    if (sale) this.mailer.send(sale);
  }

  /** Ticket de 80 mm en PDF, generado en el navegador con los datos de la venta. */
  async downloadPdf(): Promise<void> {
    const sale = this.sale();
    if (!sale || this.downloading()) return;
    this.downloading.set(true);
    try {
      await downloadReceiptPdf(sale, this.company()?.commercialName ?? 'SAVIX');
    } catch {
      this.notifications.show('No se pudo generar el PDF del comprobante.', 'error');
    } finally {
      this.downloading.set(false);
    }
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DateTimePipe, MoneyPipe } from '../../../shared/pipes/date-time.pipe';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { problemTitle } from '../../countries/models/country.model';
import { EInvoiceApiService, EInvoiceListItem, EInvoicePage } from '../data-access/einvoice-api.service';
import { EINVOICE_STATUS_LABEL, credentialLabel } from '../utils/sale-document';

const KIND_LABEL: Readonly<Record<string, string>> = { FACTURA: 'Factura', NOTA_CREDITO: 'Nota de crédito' };

@Component({
  selector: 'app-einvoice-list-page',
  imports: [PageHeader, FormsModule, RouterLink, DateTimePipe, MoneyPipe],
  templateUrl: './einvoice-list-page.html',
  styleUrl: './einvoice-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EInvoiceListPage implements OnInit {
  private readonly api = inject(EInvoiceApiService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly page = signal<EInvoicePage | null>(null);
  readonly retrying = signal<string | null>(null);
  readonly statusLabel = EINVOICE_STATUS_LABEL;
  readonly kindLabel = KIND_LABEL;
  readonly credentialLabel = credentialLabel;

  status = '';
  kind = '';

  readonly summary = computed(() => {
    const counts = this.page()?.counts ?? [];
    const total = (status: string): number => counts.filter((c) => c.status === status).reduce((sum, c) => sum + c.count, 0);
    return [
      { status: 'PENDIENTE', label: 'Pendientes de envío', count: total('PENDIENTE') },
      { status: 'ACEPTADO', label: 'Aceptados', count: total('ACEPTADO') },
      { status: 'ERROR', label: 'Con error', count: total('ERROR') },
      { status: 'RECHAZADO', label: 'Rechazados', count: total('RECHAZADO') },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ status: this.status || undefined, kind: this.kind || undefined }).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar los comprobantes electrónicos.', 'error');
      },
    });
  }

  filterBy(status: string): void {
    this.status = this.status === status ? '' : status;
    this.load();
  }

  canRetry(item: EInvoiceListItem): boolean {
    return item.status === 'ERROR' || item.status === 'RECHAZADO';
  }

  retry(item: EInvoiceListItem): void {
    if (this.retrying()) return;
    this.retrying.set(item.id);
    this.api.retry(item.id).subscribe({
      next: () => {
        this.retrying.set(null);
        this.notifications.show(`${item.number} vuelve a la cola de envío.`, 'success');
        this.load();
      },
      error: (cause: unknown) => {
        this.retrying.set(null);
        this.notifications.show(problemTitle(cause, 'No se pudo reintentar el envío.'), 'error');
      },
    });
  }
}

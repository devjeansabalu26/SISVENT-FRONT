import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { SaleApiService } from '../../sales/data-access/sale-api.service';
import { Sale, SalesTotals } from '../../sales/models/sale.model';
import { CustomerApiService } from '../data-access/customer-api.service';
import { CustomerDetail, CustomerPurchasedItem, CustomerPurchases } from '../models/customer.model';
import { DateTimePipe, MoneyPipe } from '../../../shared/pipes/date-time.pipe';

type HistoryPeriod = 'all' | '30d' | '90d' | 'year';
type HistoryView = 'sales' | 'products';

const HISTORY_PERIODS: readonly { readonly id: HistoryPeriod; readonly label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: 'year', label: 'Este año' },
];

const HISTORY_VIEWS: readonly ViewTab[] = [
  { id: 'sales', label: 'Compras', icon: 'receipt_long' },
  { id: 'products', label: 'Productos que compra', icon: 'inventory_2' },
];

const PAGE_SIZE = 10;
const EXPORT_LIMIT = 2000;

@Component({
  selector: 'app-customer-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, Paginator, ViewTabs, RouterLink, MoneyPipe, DateTimePipe],
  templateUrl: './customer-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './customer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailPage implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly sales = inject(SaleApiService);
  private readonly excel = inject(ExcelExportService);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly canManage = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.customersManage] });

  readonly loading = signal(true);
  readonly customer = signal<CustomerDetail | null>(null);

  readonly periods = HISTORY_PERIODS;
  readonly historyViews = HISTORY_VIEWS;
  readonly pageSize = PAGE_SIZE;
  readonly historyPeriod = signal<HistoryPeriod>('all');
  readonly historyPage = signal(1);
  readonly historyLoading = signal(true);
  readonly historyError = signal(false);
  readonly history = signal<readonly Sale[]>([]);
  readonly historyTotal = signal(0);
  readonly historyTotals = signal<SalesTotals | null>(null);
  readonly exporting = signal(false);
  private historyRequest = 0;

  readonly historyView = signal<HistoryView>('sales');
  readonly purchases = signal<CustomerPurchases | null>(null);
  readonly purchasesLoading = signal(true);
  readonly expanded = signal<ReadonlySet<string>>(new Set());
  private purchasesRequest = 0;
  readonly itemsBySale = computed(() => {
    const map = new Map<string, CustomerPurchasedItem[]>();
    for (const item of this.purchases()?.items ?? []) {
      const list = map.get(item.saleId) ?? [];
      list.push(item);
      map.set(item.saleId, list);
    }
    return map;
  });
  readonly productUnits = computed(() => (this.purchases()?.products ?? []).reduce((sum, product) => sum + product.units, 0));

  readonly historyAverage = computed(() => {
    const totals = this.historyTotals();
    return totals && totals.operationCount > 0 ? totals.totalAmount / totals.operationCount : 0;
  });

  readonly personal = computed(() => {
    const customer = this.customer();
    if (!customer) return [];
    return [
      { label: 'Documento de identidad', value: `${customer.documentType ?? ''} ${customer.documentNumber ?? ''}`.trim() || '—' },
      { label: 'Teléfono móvil', value: customer.phone ?? '—' },
      { label: 'Correo electrónico', value: customer.email ?? '—' },
      { label: 'Dirección', value: customer.address ?? '—' },
      { label: 'Observaciones', value: customer.notes ?? '—' }];
  });

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.loadHistory();
    this.loadPurchases();
  }

  setPeriod(value: string): void {
    this.historyPeriod.set(value as HistoryPeriod);
    this.historyPage.set(1);
    this.expanded.set(new Set());
    this.loadHistory();
    this.loadPurchases();
  }

  setView(view: string): void {
    this.historyView.set(view === 'products' ? 'products' : 'sales');
  }

  toggle(saleId: string): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(saleId)) next.add(saleId);
      return next;
    });
  }

  isOpen(saleId: string): boolean {
    return this.expanded().has(saleId);
  }

  loadPurchases(): void {
    const request = ++this.purchasesRequest;
    this.purchasesLoading.set(true);
    this.api.purchases(this.id, this.periodFrom()).subscribe({
      next: (purchases) => {
        if (request !== this.purchasesRequest) return;
        this.purchases.set(purchases);
        this.purchasesLoading.set(false);
      },
      error: () => {
        if (request !== this.purchasesRequest) return;
        this.purchases.set(null);
        this.purchasesLoading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.historyPage.set(page);
    this.loadHistory();
  }

  loadHistory(): void {
    const request = ++this.historyRequest;
    this.historyLoading.set(true);
    this.historyError.set(false);
    this.sales.list({ clientId: this.id, pageNumber: this.historyPage(), pageSize: PAGE_SIZE, from: this.periodFrom(), scope: 'STORE' }).subscribe({
      next: (page) => {
        if (request !== this.historyRequest) return;
        this.history.set(page.items);
        this.historyTotal.set(page.totalCount);
        this.historyTotals.set(page.periodTotals);
        this.historyLoading.set(false);
      },
      error: () => {
        if (request !== this.historyRequest) return;
        this.history.set([]);
        this.historyError.set(true);
        this.historyLoading.set(false);
      },
    });
  }

  async exportHistory(format: ExportFormat = 'xlsx'): Promise<void> {
    const customer = this.customer();
    if (!customer || this.exporting()) return;
    this.exporting.set(true);
    try {
      const rows: Sale[] = [];
      for (let page = 1; rows.length < EXPORT_LIMIT; page++) {
        const result = await firstValueFrom(this.sales.list({ clientId: this.id, pageNumber: page, pageSize: 100, from: this.periodFrom(), scope: 'STORE' }));
        rows.push(...result.items);
        if (!result.items.length || rows.length >= result.totalCount) break;
      }
      const confirmed = rows.filter((sale) => sale.status === 'CONFIRMED');
      const amount = confirmed.reduce((sum, sale) => sum + sale.total, 0);
      const period = HISTORY_PERIODS.find((item) => item.id === this.historyPeriod())?.label ?? '';
      const document = `${customer.documentType ?? ''} ${customer.documentNumber ?? ''}`.trim();
      await this.excel.export({
        fileName: `compras-${customer.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: `Compras de ${customer.displayName}`,
        subtitle: [document, `Compras: ${period.toLowerCase()}`].filter(Boolean).join(' · '),
        sheets: [
          { name: 'Resumen', items: [
            { label: 'Compras', value: confirmed.length, type: 'integer', detail: rows.length > confirmed.length ? `${rows.length - confirmed.length} anuladas, no suman` : '' },
            { label: 'Monto total', value: amount, type: 'money' },
            { label: 'Ticket promedio', value: confirmed.length ? amount / confirmed.length : 0, type: 'money' },
            { label: 'Primera compra', value: confirmed.at(-1)?.saleDate ?? null, type: 'datetime' },
            { label: 'Última compra', value: confirmed[0]?.saleDate ?? null, type: 'datetime' },
            { label: 'Teléfono', value: customer.phone ?? '' },
            { label: 'Correo', value: customer.email ?? '' },
          ] },
          ...(this.purchases() ? [
            excelTable({ name: 'Productos', rows: this.purchases()!.products, totals: true, columns: [
              { header: 'SKU', value: (product) => product.sku },
              { header: 'Producto', value: (product) => product.name },
              { header: 'Categoría', value: (product) => product.category ?? '' },
              { header: 'Veces comprado', value: (product) => product.purchases, type: 'integer' },
              { header: 'Unidades', value: (product) => product.units, type: 'number' },
              { header: 'Monto', value: (product) => product.amount, type: 'money' },
              { header: 'Precio promedio', value: (product) => product.averagePrice, type: 'money', total: false },
              { header: 'Última compra', value: (product) => product.lastPurchaseAt, type: 'datetime' },
            ] }),
            excelTable({ name: 'Detalle por compra', rows: this.purchases()!.items, totals: true,
              note: this.purchases()!.truncated ? 'Se muestran las 5000 líneas más recientes.' : undefined, columns: [
              { header: 'Comprobante', value: (item) => item.saleNumber },
              { header: 'Fecha', value: (item) => item.saleDate, type: 'datetime' },
              { header: 'Local', value: (item) => item.storeName },
              { header: 'SKU', value: (item) => item.sku },
              { header: 'Producto', value: (item) => item.productName },
              { header: 'Cantidad', value: (item) => item.quantity, type: 'number' },
              { header: 'Precio unitario', value: (item) => item.unitPrice, type: 'money', total: false },
              { header: 'Descuento', value: (item) => item.discount, type: 'money' },
              { header: 'Subtotal', value: (item) => (item.status === 'CONFIRMED' ? item.subtotal : 0), type: 'money' },
              { header: 'Estado', value: (item) => (item.status === 'CONFIRMED' ? 'Confirmada' : 'Anulada') },
            ] }),
          ] : []),
          excelTable({ name: 'Compras', rows, totals: true, columns: [
            { header: 'Comprobante', value: (sale) => sale.saleNumber },
            { header: 'Fecha', value: (sale) => sale.saleDate, type: 'datetime' },
            { header: 'Local', value: (sale) => sale.storeName },
            { header: 'Vendedor', value: (sale) => sale.sellerName },
            { header: 'Pago', value: (sale) => sale.paymentMethod },
            { header: 'Total', value: (sale) => (sale.status === 'CONFIRMED' ? sale.total : 0), type: 'money' },
            { header: 'Estado', value: (sale) => (sale.status === 'CONFIRMED' ? 'Confirmada' : 'Anulada') },
          ] }),
        ],
      }, format);
      this.notifications.show(format === 'pdf' ? 'Historial de compras exportado a PDF.' : 'Historial de compras exportado a Excel.', 'success');
    } catch {
      this.notifications.show('No se pudo exportar el historial.', 'error');
    } finally {
      this.exporting.set(false);
    }
  }

  private periodFrom(): string | undefined {
    const now = new Date();
    switch (this.historyPeriod()) {
      case '30d':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();
      case '90d':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return undefined;
    }
  }
}

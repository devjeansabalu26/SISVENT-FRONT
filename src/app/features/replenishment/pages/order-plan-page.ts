import { DOCUMENT } from '@angular/common';
import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { companyToday, formatCalendarDate } from '../../../core/regional/regional-format';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { LoadState, ReplenishmentLoadState, loadStateFor } from '../components/load-state/load-state';
import { ReplenishmentApiService } from '../data-access/replenishment-api.service';
import { ORDER_STATUS_LABELS, OrderStatus, StockRiskItem, StockoutRisk } from '../models/replenishment.model';
import {
  SupplierOrder, byOrderUrgency, goodsReceiptPrefill, groupBySupplier, needsOrder, orderDeadline, orderStatusOf, whatsappOrderText, whatsappUrl,
} from '../utils/order-plan';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { formatQuantity } from '../utils/replenishment-format';
import { orderStatusHint } from '../utils/status-hints';

type PlanRow = StockRiskItem & { readonly id: string };
type PlanView = 'urgency' | 'supplier';

const VIEWS: readonly ViewTab[] = [
  { id: 'urgency', label: 'Por urgencia', icon: 'priority_high' },
  { id: 'supplier', label: 'Por proveedor', icon: 'local_shipping' },
];

@Component({
  selector: 'app-order-plan-page',
  imports: [DataTable, PageHeader, KpiCard, StatusChip, ViewTabs, RouterLink, ReplenishmentLoadState],
  templateUrl: './order-plan-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss', './order-plan-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPlanPage implements OnInit {
  private readonly api = inject(ReplenishmentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly excel = inject(ExcelExportService);
  private readonly document = inject(DOCUMENT);

  readonly views = VIEWS;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusOptions = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];
  readonly state = signal<LoadState>('loading');
  readonly data = signal<StockoutRisk | null>(null);
  readonly view = signal<PlanView>(this.route.snapshot.queryParamMap.get('view') === 'supplier' ? 'supplier' : 'urgency');
  readonly statusFilter = signal<OrderStatus | 'PENDING' | ''>('PENDING');
  readonly search = signal('');
  readonly today = companyToday();
  readonly printing = signal<SupplierOrder | null>(null);
  private readonly companies = inject(CompanyContextService);
  readonly companyName = computed(() => this.companies.company()?.commercialName ?? '');

  private readonly items = computed(() => [...(this.data()?.items ?? [])].sort(byOrderUrgency));

  readonly counts = computed(() => {
    const counts: Record<OrderStatus, number> = { ORDER_NOW: 0, ORDER_SOON: 0, OK: 0, NO_SALES: 0 };
    for (const item of this.items()) counts[orderStatusOf(item)]++;
    return counts;
  });

  readonly rows = computed<readonly PlanRow[]>(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();
    return this.items()
      .filter((item) => {
        const current = orderStatusOf(item);
        if (status === 'PENDING') return current === 'ORDER_NOW' || current === 'ORDER_SOON';
        return !status || current === status;
      })
      .filter((item) => !term || `${item.sku} ${item.name} ${item.supplierName ?? ''}`.toLowerCase().includes(term))
      .map((item) => ({ ...item, id: item.productId }));
  });

  readonly suppliers = computed(() => groupBySupplier(this.items(), this.today));

  readonly columns: readonly DataTableColumn<PlanRow>[] = [
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock', value: (row) => `${formatQuantity(row.currentStock)} uds` },
    { key: 'onOrder', label: 'En camino', value: (row) => (row.onOrder ? `${formatQuantity(row.onOrder)} uds` : '—') },
    { key: 'pace', label: 'Venta diaria', value: (row) => `${formatQuantity(row.averageDailySales)} uds` },
    { key: 'coverage', label: 'Se acaba en', value: (row) => (row.coverageDays === null ? '—' : `${row.coverageDays} días`) },
    { key: 'deadline', label: 'Pedir antes del', value: (row) => this.deadline(row).label },
    { key: 'quantity', label: 'Cantidad a pedir', value: (row) => (row.orderQuantity ? `${row.orderQuantity} uds` : '—') },
    { key: 'supplier', label: 'Proveedor', value: (row) => `${row.supplierName ?? 'Sin proveedor'} · ${row.leadTimeDays} días` },
    { key: 'status', label: 'Estado', value: (row) => ORDER_STATUS_LABELS[orderStatusOf(row)], type: 'status', hint: orderStatusHint },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.api.stockoutRisk().subscribe({
      next: (data) => {
        this.data.set(data);
        this.state.set('ready');
      },
      error: (cause: unknown) => this.state.set(loadStateFor(cause)),
    });
  }

  setView(view: string): void {
    const next: PlanView = view === 'supplier' ? 'supplier' : 'urgency';
    this.view.set(next);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { view: next }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  deadline(item: StockRiskItem) {
    return orderDeadline(item, this.today);
  }

  statusHint(item: StockRiskItem): string | null {
    return orderStatusHint(item);
  }

  statusLabel(item: StockRiskItem): string {
    return ORDER_STATUS_LABELS[orderStatusOf(item)];
  }

  formatDate(date: string | null): string {
    return date ? formatCalendarDate(date) : '—';
  }

  quantity(value: number): string {
    return formatQuantity(value);
  }

  whatsapp(order: SupplierOrder): string {
    return whatsappUrl(whatsappOrderText(order, this.companyName()));
  }

  print(order: SupplierOrder): void {
    this.printing.set(order);
    const body = this.document.body;
    requestAnimationFrame(() => {
      body.classList.add('print-mode');
      this.document.defaultView?.print();
      body.classList.remove('print-mode');
    });
  }

  createReceipt(order: SupplierOrder): void {
    void this.router.navigate(['/app/goods-receipts/new'], { state: { prefill: goodsReceiptPrefill(order) } });
  }

  async exportExcel(supplier?: string, format: ExportFormat = 'xlsx'): Promise<void> {
    const items = this.items()
      .filter((item) => !supplier || (item.supplierName ?? 'Sin proveedor asignado') === supplier)
      .filter(needsOrder)
      .sort((a, b) => (a.supplierName ?? '').localeCompare(b.supplierName ?? '', 'es') || byOrderUrgency(a, b));
    await this.excel.export({
      fileName: supplier ? `pedido-${supplier.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'plan-de-pedidos',
      title: supplier ? `Pedido a ${supplier}` : 'Plan de pedidos',
      subtitle: `Qué pedir y cuándo · ${items.length} productos`,
      sheets: [
        excelTable({ name: supplier ? 'Pedido' : 'Plan de pedidos', rows: items, columns: [
          { header: 'Proveedor', value: (item) => item.supplierName ?? 'Sin proveedor asignado' },
          { header: 'SKU', value: (item) => item.sku },
          { header: 'Producto', value: (item) => item.name },
          { header: 'Cantidad a pedir', value: (item) => item.orderQuantity ?? 0, type: 'number' },
          { header: 'Costo referencial', value: (item) => item.referenceCost ?? null, type: 'money' },
          { header: 'Subtotal estimado', value: (item) => (item.referenceCost != null ? (item.orderQuantity ?? 0) * item.referenceCost : null), type: 'money', total: true },
          { header: 'Pedir antes del', value: (item) => orderDeadline(item, this.today).date, type: 'date' },
          { header: 'Stock actual', value: (item) => item.currentStock, type: 'number', total: false },
          { header: 'En camino', value: (item) => item.onOrder ?? 0, type: 'number', total: false },
          { header: 'Venta diaria', value: (item) => item.averageDailySales, type: 'number', total: false },
          { header: 'Días de entrega', value: (item) => item.leadTimeDays, type: 'integer', total: false },
          { header: 'Estado', value: (item) => ORDER_STATUS_LABELS[orderStatusOf(item)] },
        ], totals: true }),
      ],
    }, format);
  }

}

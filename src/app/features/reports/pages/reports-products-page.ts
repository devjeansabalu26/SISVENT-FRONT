import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { formatMoney, formatQuantity } from '../../../core/regional/regional-format';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { MoneyPipe, QuantityPipe } from '../../../shared/pipes/date-time.pipe';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { TopProduct } from '../models/sales-report.model';
import { productMatrix } from '../utils/product-matrix';

type ProductsView = 'units' | 'revenue' | 'margin' | 'matrix';
type ProductRow = TopProduct & { readonly id: string; readonly position: number };

const VIEWS: readonly ViewTab[] = [
  { id: 'units', label: 'Más vendidos', icon: 'shopping_basket' },
  { id: 'revenue', label: 'Más ingresos', icon: 'payments' },
  { id: 'margin', label: 'Mejor margen', icon: 'percent' },
  { id: 'matrix', label: 'Matriz ventas × margen', icon: 'grid_view' },
];

const DESCRIPTION: Readonly<Record<ProductsView, string>> = {
  units: 'Productos ordenados por unidades vendidas: los que más rotan.',
  revenue: 'Productos ordenados por ingresos: los que más dinero traen.',
  margin: 'Productos ordenados por margen sobre el costo: los que más ganancia dejan por cada venta.',
  matrix: 'Cada producto según cuánto se vende y cuánto margen deja, comparado con la mediana de tus productos.',
};

@Component({
  selector: 'app-reports-products-page',
  imports: [PageHeader, KpiCard, DataTable, ViewTabs, ReportToolbar, MoneyPipe, QuantityPipe],
  providers: [ReportState],
  templateUrl: './reports-products-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsProductsPage {
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  readonly state = inject(ReportState);
  readonly views = VIEWS;

  constructor() {
    this.state.topCount = 90;
  }

  readonly view = computed<ProductsView>(() => {
    const value = this.state.viewParam();
    return value === 'revenue' || value === 'margin' || value === 'matrix' ? value : 'units';
  });
  readonly matrix = computed(() => productMatrix(this.products()));
  readonly description = computed(() => DESCRIPTION[this.view()]);
  readonly title = computed(() => VIEWS.find((item) => item.id === this.view())?.label ?? '');

  private readonly products = computed(() => this.state.report()?.topProducts ?? []);

  readonly rows = computed<readonly ProductRow[]>(() => {
    const view = this.view();
    const list = [...this.products()];
    if (view === 'units') list.sort((a, b) => b.units - a.units || b.revenue - a.revenue);
    else if (view === 'revenue') list.sort((a, b) => b.revenue - a.revenue);
    else list.sort((a, b) => (b.marginPercent ?? -Infinity) - (a.marginPercent ?? -Infinity) || b.revenue - a.revenue);
    return list.map((item, index) => ({ ...item, id: item.sku, position: index + 1 }));
  });

  readonly totals = computed(() => {
    const list = this.products();
    const withMargin = list.filter((item) => item.marginPercent !== null);
    const revenue = list.reduce((sum, item) => sum + item.revenue, 0);
    const weighted = withMargin.reduce((sum, item) => sum + (item.marginPercent ?? 0) * item.revenue, 0);
    const marginRevenue = withMargin.reduce((sum, item) => sum + item.revenue, 0);
    return {
      products: list.length,
      units: list.reduce((sum, item) => sum + item.units, 0),
      revenue,
      margin: marginRevenue > 0 ? weighted / marginRevenue : null,
      withoutCost: list.length - withMargin.length,
    };
  });

  readonly columns: readonly DataTableColumn<ProductRow>[] = [
    { key: 'position', label: '#', value: (row) => row.position },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'category', label: 'Categoría', value: (row) => row.category ?? '—' },
    { key: 'units', label: 'Unidades', value: (row) => formatQuantity(row.units) },
    { key: 'revenue', label: 'Ingresos', value: (row) => formatMoney(row.revenue) },
    { key: 'margin', label: 'Margen', value: (row) => (row.marginPercent !== null ? `${row.marginPercent.toFixed(1)}%` : 'Sin costo') },
  ];

  money(value: number): string {
    return formatMoney(value);
  }

  quantity(value: number): string {
    return formatQuantity(value);
  }


  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    if (!this.state.report()) return;
    const totals = this.totals();
    const matrix = this.matrix();
    const matrixRows = [
      ...matrix.groups.flatMap((group) => group.products.map((product) => ({ group: group.title, product }))),
      ...matrix.withoutCost.map((product) => ({ group: 'Sin costo', product })),
    ];
    await this.excel.export({
      fileName: 'reporte-productos',
      title: 'Reporte de productos',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Productos vendidos', value: totals.products, type: 'integer' },
          { label: 'Unidades', value: totals.units, type: 'number' },
          { label: 'Ingresos', value: totals.revenue, type: 'money' },
          { label: 'Margen promedio', value: totals.margin, type: 'percent', detail: 'Ponderado por ingresos' },
          { label: 'Productos sin costo', value: totals.withoutCost, type: 'integer', detail: 'No se puede calcular su margen' },
        ] },
        excelTable({ name: this.view() === 'matrix' ? 'Más vendidos' : this.title(), rows: this.view() === 'matrix' ? [...this.products()].sort((a, b) => b.units - a.units) : this.rows(), totals: true, columns: [
          { header: 'SKU', value: (row) => row.sku },
          { header: 'Producto', value: (row) => row.name },
          { header: 'Categoría', value: (row) => row.category ?? '' },
          { header: 'Unidades', value: (row) => row.units, type: 'number' },
          { header: 'Ingresos', value: (row) => row.revenue, type: 'money' },
          { header: 'Margen', value: (row) => row.marginPercent, type: 'percent', total: false },
        ] }),
        excelTable({ name: 'Matriz ventas × margen', rows: matrixRows, columns: [
          { header: 'Grupo', value: (row) => row.group },
          { header: 'SKU', value: (row) => row.product.sku },
          { header: 'Producto', value: (row) => row.product.name },
          { header: 'Unidades', value: (row) => row.product.units, type: 'number' },
          { header: 'Ingresos', value: (row) => row.product.revenue, type: 'money' },
          { header: 'Margen', value: (row) => row.product.marginPercent, type: 'percent' },
        ] }),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }
}

import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { MoneyPipe, QuantityPipe, ShortDatePipe } from '../../../shared/pipes/date-time.pipe';
import { formatMoney, formatQuantity } from '../../../core/regional/regional-format';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { MetricDelta } from '../models/sales-report.model';
import { periodLabel } from '../utils/report-period';
import { compareMetric, periodInsights } from '../utils/period-insights';

@Component({
  selector: 'app-reports-page',
  imports: [PageHeader, RouterLink, ReportToolbar, MoneyPipe, QuantityPipe, ShortDatePipe],
  providers: [ReportState],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  readonly state = inject(ReportState);

  constructor() {
    this.state.topCount = 5;
  }

  readonly periodLabel = computed(() => periodLabel(this.state.period()));
  readonly comparison = computed(() => {
    const report = this.state.report();
    if (!report) return [];
    const money = (value: number) => formatMoney(value);
    const count = (value: number) => formatQuantity(value);
    return [
      { label: 'Ventas', value: compareMetric(report.totalSales), text: money },
      { label: 'Transacciones', value: compareMetric(report.transactions), text: count },
      { label: 'Ticket promedio', value: compareMetric(report.averageTicket), text: money },
      { label: 'Unidades vendidas', value: compareMetric(report.unitsSold), text: count },
    ];
  });
  readonly insights = computed(() => {
    const report = this.state.report();
    return report ? periodInsights(report.dailySeries, report.from, report.to) : null;
  });
  readonly topCategory = computed(() => this.state.report()?.byCategory[0] ?? null);
  readonly topProduct = computed(() => this.state.report()?.topProducts[0] ?? null);
  readonly topSeller = computed(() => this.state.report()?.bySeller[0] ?? null);

  trend(metric: MetricDelta): 'up' | 'down' | 'flat' {
    if (metric.deltaPercent === null) return 'flat';
    return metric.deltaPercent >= 0 ? 'up' : 'down';
  }

  delta(metric: MetricDelta): string | undefined {
    return metric.deltaPercent === null ? undefined : `${metric.deltaPercent.toFixed(1)}%`;
  }


  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.state.report();
    if (!report) return;
    const delta = (metric: { readonly deltaPercent: number | null }) =>
      metric.deltaPercent == null ? 'Sin datos del período anterior' : `${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent.toFixed(1)}% vs el período anterior`;
    await this.excel.export({
      fileName: 'reporte-resumen',
      title: 'Reporte de resumen',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Ventas totales', value: report.totalSales.value, type: 'money', detail: delta(report.totalSales) },
          { label: 'Transacciones', value: report.transactions.value, type: 'integer', detail: delta(report.transactions) },
          { label: 'Ticket promedio', value: report.averageTicket.value, type: 'money', detail: delta(report.averageTicket) },
          { label: 'Productos vendidos', value: report.unitsSold.value, type: 'number', detail: delta(report.unitsSold) },
        ] },
        excelTable({ name: 'Ventas por día', rows: report.dailySeries, totals: true, columns: [
          { header: 'Fecha', value: (row) => row.date, type: 'date' },
          { header: 'Monto', value: (row) => row.amount, type: 'money' },
        ] }),
        excelTable({ name: 'Por categoría', rows: report.byCategory, totals: true, columns: [
          { header: 'Categoría', value: (row) => row.name },
          { header: 'Ventas', value: (row) => row.amount, type: 'money' },
          { header: '% del total', value: (row) => row.percent, type: 'percent', total: false },
        ] }),
        excelTable({ name: 'Por vendedor', rows: report.bySeller, totals: true, columns: [
          { header: 'Vendedor', value: (row) => row.name },
          { header: 'Ventas', value: (row) => row.amount, type: 'money' },
          { header: '% del total', value: (row) => row.percent, type: 'percent', total: false },
        ] }),
        excelTable({ name: 'Productos', rows: report.topProducts, columns: [
          { header: '#', value: (row) => row.rank, type: 'integer', total: false },
          { header: 'SKU', value: (row) => row.sku },
          { header: 'Producto', value: (row) => row.name },
          { header: 'Categoría', value: (row) => row.category ?? '' },
          { header: 'Unidades', value: (row) => row.units, type: 'number' },
          { header: 'Ingresos', value: (row) => row.revenue, type: 'money' },
          { header: 'Margen', value: (row) => row.marginPercent, type: 'percent' },
        ] }),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }
}

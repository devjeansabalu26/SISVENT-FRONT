import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { SalesReportApiService } from '../data-access/sales-report-api.service';
import { Heatmap, HeatmapCell, HeatmapRow, buildHeatmap, hourLabel } from '../utils/sales-heatmap';
import { ReportPeriod, periodRange } from '../utils/report-period';
import { NotificationService } from '../../../core/notifications/notification.service';
import { formatMoney } from '../../../core/regional/regional-format';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { CompactMoneyPipe, MoneyPipe } from '../../../shared/pipes/date-time.pipe';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { DailyPoint } from '../models/sales-report.model';
import { periodLabel } from '../utils/report-period';

type SalesView = 'trend' | 'hours' | 'categories' | 'sellers';

const VIEWS: readonly ViewTab[] = [
  { id: 'trend', label: 'Tendencia', icon: 'show_chart' },
  { id: 'hours', label: 'Por día y hora', icon: 'grid_on' },
  { id: 'categories', label: 'Por categoría', icon: 'category' },
  { id: 'sellers', label: 'Por vendedor', icon: 'badge' },
];

@Component({
  selector: 'app-reports-sales-page',
  imports: [PageHeader, KpiCard, ViewTabs, ReportToolbar, MoneyPipe, CompactMoneyPipe],
  providers: [ReportState],
  templateUrl: './reports-sales-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsSalesPage {
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  readonly state = inject(ReportState);
  readonly views = VIEWS;

  readonly view = computed<SalesView>(() => {
    const value = this.state.viewParam();
    return value === 'hours' || value === 'categories' || value === 'sellers' ? value : 'trend';
  });

  private readonly api = inject(SalesReportApiService);
  private heatmapRequest = 0;
  readonly heatmapLoading = signal(false);
  readonly heatmap = signal<Heatmap | null>(null);
  readonly hourLabel = hourLabel;

  constructor() {
    effect(() => {
      if (this.view() !== 'hours') return;
      const period = this.state.period();
      const storeId = this.state.storeId();
      untracked(() => this.loadHeatmap(period, storeId));
    });
  }

  private loadHeatmap(period: ReportPeriod, storeId: string): void {
    const request = ++this.heatmapRequest;
    const range = periodRange(period);
    this.heatmapLoading.set(true);
    this.api.heatmap({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined }).subscribe({
      next: (response) => {
        if (request !== this.heatmapRequest) return;
        this.heatmap.set(buildHeatmap(response.cells));
        this.heatmapLoading.set(false);
      },
      error: () => {
        if (request !== this.heatmapRequest) return;
        this.heatmap.set(null);
        this.heatmapLoading.set(false);
      },
    });
  }

  cellTitle(row: HeatmapRow, cell: HeatmapCell): string {
    return `${row.label} ${hourLabel(cell.hour)}: ${cell.transactions} ventas · ${formatMoney(cell.amount)}`;
  }
  readonly periodLabel = computed(() => periodLabel(this.state.period()));
  readonly series = computed(() => this.state.report()?.dailySeries ?? []);
  readonly maxAmount = computed(() => Math.max(...this.series().map((point) => point.amount), 1));
  readonly bestDay = computed<DailyPoint | null>(() => [...this.series()].sort((a, b) => b.amount - a.amount)[0] ?? null);
  readonly averageDay = computed(() => {
    const days = this.series();
    return days.length ? days.reduce((sum, point) => sum + point.amount, 0) / days.length : 0;
  });
  readonly daysWithSales = computed(() => this.series().filter((point) => point.amount > 0).length);


  money(value: number): string {
    return formatMoney(value);
  }

  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.state.report();
    if (!report) return;
    const heatmap = this.heatmap();
    const heatCells = heatmap ? heatmap.rows.flatMap((row) => row.cells.filter((cell) => cell.transactions > 0).map((cell) => ({ day: row.label, cell }))) : [];
    const delta = (metric: { readonly deltaPercent: number | null }) =>
      metric.deltaPercent == null ? 'Sin datos del período anterior' : `${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent.toFixed(1)}% vs el período anterior`;
    await this.excel.export({
      fileName: 'reporte-ventas',
      title: 'Reporte de ventas',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Ventas del período', value: report.totalSales.value, type: 'money', detail: delta(report.totalSales) },
          { label: 'Transacciones', value: report.transactions.value, type: 'integer', detail: delta(report.transactions) },
          { label: 'Ticket promedio', value: report.averageTicket.value, type: 'money', detail: delta(report.averageTicket) },
          { label: 'Promedio por día', value: this.averageDay(), type: 'money' },
          { label: 'Mejor día', value: this.bestDay()?.amount ?? null, type: 'money', detail: this.bestDay()?.date ?? '' },
          { label: 'Días con ventas', value: this.daysWithSales(), type: 'integer', detail: `de ${this.series().length} días` },
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
        ...(heatmap ? [excelTable({ name: 'Por día y hora', rows: heatCells, totals: true, columns: [
          { header: 'Día', value: (row) => row.day },
          { header: 'Hora', value: (row) => hourLabel(row.cell.hour) },
          { header: 'Ventas', value: (row) => row.cell.transactions, type: 'integer' },
          { header: 'Monto', value: (row) => row.cell.amount, type: 'money' },
        ] })] : []),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }
}

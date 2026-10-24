import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { formatMoney } from '../../../core/regional/regional-format';
import { MoneyPipe } from '../../../shared/pipes/date-time.pipe';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { SalesReportApiService } from '../data-access/sales-report-api.service';
import { TeamMemberRow, TeamReport } from '../models/team-report.model';
import { ReportPeriod, periodLabel, periodRange } from '../utils/report-period';

type TeamView = 'productivity' | 'sales' | 'discounts';

const VIEWS: readonly ViewTab[] = [
  { id: 'productivity', label: 'Por hora trabajada', icon: 'schedule' },
  { id: 'sales', label: 'Ventas por persona', icon: 'leaderboard' },
  { id: 'discounts', label: 'Descuentos y anulaciones', icon: 'money_off' },
];

@Component({
  selector: 'app-reports-team-page',
  imports: [PageHeader, KpiCard, ViewTabs, ReportToolbar, StatusChip, RouterLink, MoneyPipe],
  providers: [ReportState],
  templateUrl: './reports-team-page.html',
  styleUrls: ['./reports-page.scss', './reports-cash-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsTeamPage {
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  private readonly api = inject(SalesReportApiService);
  readonly state = inject(ReportState);
  readonly views = VIEWS;

  private requestId = 0;
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly report = signal<TeamReport | null>(null);

  readonly view = computed<TeamView>(() => {
    const value = this.state.viewParam();
    return value === 'sales' || value === 'discounts' ? value : 'productivity';
  });
  readonly periodLabel = computed(() => periodLabel(this.state.period()));
  readonly byRate = computed(() =>
    [...(this.report()?.members ?? [])].sort((a, b) => (b.amountPerHour ?? -1) - (a.amountPerHour ?? -1) || b.amount - a.amount),
  );
  readonly byDiscounts = computed(() =>
    [...(this.report()?.members ?? [])].sort((a, b) => b.discounts + b.cancelledAmount - (a.discounts + a.cancelledAmount)),
  );
  readonly noShifts = computed(() => {
    const report = this.report();
    return !!report && report.attendanceEnabled && report.members.every((member) => member.shifts === 0);
  });

  constructor() {
    this.state.loadSales = false;
    effect(() => {
      const period = this.state.period();
      const storeId = this.state.storeId();
      untracked(() => this.load(period, storeId));
    });
  }

  private load(period: ReportPeriod, storeId: string): void {
    const requestId = ++this.requestId;
    const range = periodRange(period);
    this.loading.set(true);
    this.failed.set(false);
    this.api.team({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined }).subscribe({
      next: (report) => {
        if (requestId !== this.requestId) return;
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.requestId) return;
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  reload(): void {
    this.load(this.state.period(), this.state.storeId());
  }

  hoursText(row: TeamMemberRow): string {
    if (row.hours == null) return '—';
    return `${row.hours.toFixed(1)} h`;
  }

  rateHint(row: TeamMemberRow, minHours: number): string | null {
    if (row.hours == null) return null;
    if (row.amountPerHour == null) return `Trabajó menos de ${minHours} h en el período; no se calcula la venta por hora.`;
    return `${formatMoney(row.amount)} vendidos en ${row.hours.toFixed(1)} h trabajadas (${row.shifts} ${row.shifts === 1 ? 'turno' : 'turnos'}).`;
  }

  missingHint(row: TeamMemberRow): string {
    return `${row.shiftsWithoutCheckout} ${row.shiftsWithoutCheckout === 1 ? 'turno' : 'turnos'} sin marcar salida: esas horas no se cuentan, así que su venta por hora puede verse más alta.`;
  }


  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.report();
    if (!report) return;
    const summary = report.summary;
    await this.excel.export({
      fileName: 'reporte-equipo',
      title: 'Reporte de equipo',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Ventas del equipo', value: summary.amount, type: 'money', detail: `${summary.sales} ventas · ${summary.members} personas` },
          { label: 'Horas trabajadas', value: summary.hours, type: 'number', detail: report.attendanceEnabled ? `${summary.shiftsWithoutCheckout} turnos sin salida (no suman horas)` : 'Asistencia desactivada' },
          { label: 'Venta por hora', value: summary.amountPerHour, type: 'money', detail: 'Del equipo completo' },
          { label: 'Mejor por hora', value: summary.bestPerHourName ?? '', detail: summary.bestPerHour != null ? `${this.money(summary.bestPerHour)} por hora` : '' },
          { label: 'Descuentos', value: summary.discounts, type: 'money' },
          { label: 'Ventas anuladas', value: summary.cancelled, type: 'integer', detail: `${this.money(summary.cancelledAmount)} anulados` },
        ] },
        excelTable({ name: 'Equipo', rows: report.members, totals: true, columns: [
          { header: 'Persona', value: (row) => row.name },
          { header: 'Ventas', value: (row) => row.sales, type: 'integer' },
          { header: 'Monto', value: (row) => row.amount, type: 'money' },
          { header: '% del total', value: (row) => row.share, type: 'percent', total: false },
          { header: 'Unidades', value: (row) => row.units, type: 'number' },
          { header: 'Ticket promedio', value: (row) => row.averageTicket, type: 'money', total: false },
          { header: 'Unidades por venta', value: (row) => row.unitsPerSale, type: 'number', total: false },
          { header: 'Horas', value: (row) => row.hours, type: 'number' },
          { header: 'Turnos', value: (row) => row.shifts, type: 'integer' },
          { header: 'Turnos sin salida', value: (row) => row.shiftsWithoutCheckout, type: 'integer' },
          { header: 'Venta por hora', value: (row) => row.amountPerHour, type: 'money', total: false },
          { header: 'Ventas por hora', value: (row) => row.salesPerHour, type: 'number', total: false },
          { header: 'Descuentos', value: (row) => row.discounts, type: 'money' },
          { header: 'Anuladas', value: (row) => row.cancelled, type: 'integer' },
          { header: 'Monto anulado', value: (row) => row.cancelledAmount, type: 'money' },
        ] }),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }

  money(value: number): string {
    return formatMoney(value);
  }
}

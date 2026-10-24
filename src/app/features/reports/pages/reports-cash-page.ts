import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { formatDateTime, formatMoney } from '../../../core/regional/regional-format';
import { DateTimePipe, MoneyPipe, ShortDatePipe } from '../../../shared/pipes/date-time.pipe';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { SalesReportApiService } from '../data-access/sales-report-api.service';
import { CASH_REASON_LABEL, CashIssueReason, CashReport, CashSessionIssue, CashierCashRow } from '../models/cash-report.model';
import { ReportPeriod, periodLabel, periodRange } from '../utils/report-period';

type CashView = 'differences' | 'cashiers' | 'payments' | 'review';

const VIEWS: readonly ViewTab[] = [
  { id: 'differences', label: 'Diferencias', icon: 'balance' },
  { id: 'cashiers', label: 'Por cajero', icon: 'badge' },
  { id: 'payments', label: 'Medios de pago', icon: 'credit_card' },
  { id: 'review', label: 'Cajas para revisar', icon: 'flag' },
];

@Component({
  selector: 'app-reports-cash-page',
  imports: [PageHeader, KpiCard, ViewTabs, ReportToolbar, StatusChip, MoneyPipe, DateTimePipe, ShortDatePipe],
  providers: [ReportState],
  templateUrl: './reports-cash-page.html',
  styleUrls: ['./reports-page.scss', './reports-cash-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsCashPage {
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  private readonly api = inject(SalesReportApiService);
  readonly state = inject(ReportState);
  readonly views = VIEWS;
  readonly reasonLabel = CASH_REASON_LABEL;

  private requestId = 0;
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly report = signal<CashReport | null>(null);

  readonly view = computed<CashView>(() => {
    const value = this.state.viewParam();
    return value === 'cashiers' || value === 'payments' || value === 'review' ? value : 'differences';
  });
  readonly periodLabel = computed(() => periodLabel(this.state.period()));
  readonly maxDayShortage = computed(() => Math.max(...(this.report()?.byDay ?? []).map((day) => Math.max(day.shortage, day.surplus)), 1));
  readonly paymentsTotal = computed(() => (this.report()?.paymentMethods ?? []).reduce((sum, item) => sum + item.amount, 0));

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
    this.api.cash({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined }).subscribe({
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

  cashierHint(row: CashierCashRow): string | null {
    if (row.withDifference < 2 || row.shortage <= 0) return null;
    return `Tuvo diferencias en ${row.withDifference} de ${row.sessions} cajas y un faltante total de ${formatMoney(row.shortage)}. Que se repita con la misma persona es una señal para revisar.`;
  }

  reasonHint(issue: CashSessionIssue, reason: CashIssueReason): string | null {
    switch (reason) {
      case 'SHORTAGE':
        return `Se esperaban ${formatMoney(issue.expectedCash ?? 0)} y se contaron ${formatMoney(issue.countedCash ?? 0)}: faltaron ${formatMoney(Math.abs(issue.difference ?? 0))}.`;
      case 'SURPLUS':
        return `Se esperaban ${formatMoney(issue.expectedCash ?? 0)} y se contaron ${formatMoney(issue.countedCash ?? 0)}: sobraron ${formatMoney(issue.difference ?? 0)}.`;
      case 'FORCED':
        return `Abrió ${issue.openedBy} y cerró ${issue.closedBy ?? 'otra persona'}.${issue.forceReason ? ` Motivo: ${issue.forceReason}` : ''}`;
      case 'LONG_OPEN':
        return `Abierta desde ${formatDateTime(issue.openedAt)} (${Math.floor(issue.hoursOpen)} horas). Puede que olvidaran cerrarla.`;
    }
  }

  differenceClass(value: number | null): string {
    if (value == null || Math.abs(value) < 0.01) return '';
    return value < 0 ? 'amount--short' : 'amount--over';
  }


  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.report();
    if (!report) return;
    const summary = report.summary;
    await this.excel.export({
      fileName: 'reporte-caja-y-pagos',
      title: 'Reporte de caja y pagos',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Faltantes', value: summary.shortage, type: 'money', detail: 'Se contó menos efectivo del esperado' },
          { label: 'Sobrantes', value: summary.surplus, type: 'money', detail: 'Se contó más efectivo del esperado' },
          { label: 'Diferencia neta', value: summary.netDifference, type: 'money' },
          { label: 'Cajas cerradas', value: summary.closedSessions, type: 'integer' },
          { label: 'Cajas con diferencia', value: summary.sessionsWithDifference, type: 'integer' },
          { label: 'Cierres forzados', value: summary.forcedCloses, type: 'integer', detail: 'Cerradas por una persona distinta a quien abrió' },
          { label: 'Cajas abiertas', value: summary.openNow, type: 'integer', detail: `${summary.longOpen} abiertas hace más de ${report.longOpenHours} h` },
          { label: 'Ventas cobradas', value: this.paymentsTotal(), type: 'money', detail: 'Suma de todos los medios de pago' },
        ] },
        excelTable({ name: 'Diferencias por día', rows: report.byDay, totals: true, columns: [
          { header: 'Fecha', value: (row) => row.date, type: 'date' },
          { header: 'Cajas cerradas', value: (row) => row.sessions, type: 'integer' },
          { header: 'Faltante', value: (row) => row.shortage, type: 'money' },
          { header: 'Sobrante', value: (row) => row.surplus, type: 'money' },
          { header: 'Neto', value: (row) => row.netDifference, type: 'money' },
        ] }),
        excelTable({ name: 'Por cajero', rows: report.byCashier, totals: true, columns: [
          { header: 'Cajero', value: (row) => row.name },
          { header: 'Cajas', value: (row) => row.sessions, type: 'integer' },
          { header: 'Con diferencia', value: (row) => row.withDifference, type: 'integer' },
          { header: 'Faltante', value: (row) => row.shortage, type: 'money' },
          { header: 'Sobrante', value: (row) => row.surplus, type: 'money' },
          { header: 'Neto', value: (row) => row.netDifference, type: 'money' },
          { header: 'Cierres forzados', value: (row) => row.forced, type: 'integer' },
        ] }),
        excelTable({ name: 'Medios de pago', rows: report.paymentMethods, totals: true, columns: [
          { header: 'Medio de pago', value: (row) => row.name },
          { header: 'Ventas', value: (row) => row.transactions, type: 'integer' },
          { header: 'Monto', value: (row) => row.amount, type: 'money' },
          { header: '% del total', value: (row) => row.percent, type: 'percent', total: false },
        ] }),
        excelTable({ name: 'Cajas para revisar', rows: report.issues, columns: [
          { header: 'Local', value: (row) => row.storeName },
          { header: 'Abrió', value: (row) => row.openedBy },
          { header: 'Cerró', value: (row) => row.closedBy ?? '' },
          { header: 'Apertura', value: (row) => row.openedAt, type: 'datetime' },
          { header: 'Cierre', value: (row) => row.closedAt, type: 'datetime' },
          { header: 'Estado', value: (row) => (row.closedAt ? 'Cerrada' : 'Abierta') },
          { header: 'Esperado', value: (row) => row.expectedCash, type: 'money' },
          { header: 'Contado', value: (row) => row.countedCash, type: 'money' },
          { header: 'Diferencia', value: (row) => row.difference, type: 'money' },
          { header: 'Motivo', value: (row) => row.reasons.map((reason) => this.reasonLabel[reason]).join(' / ') },
          { header: 'Motivo del cierre forzado', value: (row) => row.forceReason ?? '' },
        ] }),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }
}

import { DOCUMENT } from '@angular/common';
import { ExcelExportService, ExportFormat, excelTable } from '../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DateTimePipe, MoneyPipe } from '../../../shared/pipes/date-time.pipe';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ViewTab, ViewTabs } from '../../../shared/ui/view-tabs/view-tabs';
import { ReportToolbar } from '../components/report-toolbar';
import { ReportState } from '../data-access/report-state';
import { SalesReportApiService } from '../data-access/sales-report-api.service';
import { CustomerRankRow, CustomerReport, LapsedCustomerRow } from '../models/customer-report.model';
import { ReportPeriod, periodLabel, periodRange } from '../utils/report-period';

type CustomerView = 'frequent' | 'lapsed' | 'business';

const VIEWS: readonly ViewTab[] = [
  { id: 'frequent', label: 'Clientes frecuentes', icon: 'favorite' },
  { id: 'lapsed', label: 'Dejaron de comprar', icon: 'person_off' },
  { id: 'business', label: 'Clientes empresa', icon: 'business' },
];

@Component({
  selector: 'app-reports-customers-page',
  imports: [PageHeader, KpiCard, ViewTabs, ReportToolbar, StatusChip, RouterLink, MoneyPipe, DateTimePipe],
  providers: [ReportState],
  templateUrl: './reports-customers-page.html',
  styleUrls: ['./reports-page.scss', './reports-cash-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsCustomersPage {
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  private readonly api = inject(SalesReportApiService);
  readonly state = inject(ReportState);
  readonly views = VIEWS;

  private requestId = 0;
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly report = signal<CustomerReport | null>(null);

  readonly view = computed<CustomerView>(() => {
    const value = this.state.viewParam();
    return value === 'lapsed' || value === 'business' ? value : 'frequent';
  });
  readonly periodLabel = computed(() => periodLabel(this.state.period()));
  readonly businessPercent = computed(() => {
    const summary = this.report()?.summary;
    if (!summary || summary.totalAmount <= 0) return 0;
    return Math.round((summary.businessAmount / summary.totalAmount) * 1000) / 10;
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
    this.api.customers({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined }).subscribe({
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

  documentText(row: { readonly documentType: string | null; readonly documentNumber: string | null }): string {
    return row.documentNumber ? `${row.documentType ?? 'Doc.'} ${row.documentNumber}` : 'Sin documento';
  }

  frequencyText(days: number | null): string {
    if (days == null) return 'Una sola compra';
    if (days < 1) return 'Varias veces al día';
    return `Cada ${Math.round(days)} ${Math.round(days) === 1 ? 'día' : 'días'}`;
  }

  lapsedHint(row: LapsedCustomerRow): string {
    const usual = row.averageDaysBetween != null ? `Solía comprar cada ${Math.round(row.averageDaysBetween)} días` : 'Compraba seguido';
    return `${usual} y lleva ${row.daysSinceLastPurchase} días sin volver. Es buen momento para llamarlo o enviarle una promoción.`;
  }


  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.report();
    if (!report) return;
    const summary = report.summary;
    const rankColumns = [
      { header: 'Cliente', value: (row: CustomerRankRow) => row.name },
      { header: 'Documento', value: (row: CustomerRankRow) => this.documentText(row) },
      { header: 'Teléfono', value: (row: CustomerRankRow) => row.phone ?? '' },
      { header: 'Compras', value: (row: CustomerRankRow) => row.purchases, type: 'integer' as const },
      { header: 'Monto', value: (row: CustomerRankRow) => row.amount, type: 'money' as const },
      { header: 'Ticket promedio', value: (row: CustomerRankRow) => row.averageTicket, type: 'money' as const, total: false },
      { header: 'Compra cada (días)', value: (row: CustomerRankRow) => row.averageDaysBetween, type: 'number' as const, total: false },
      { header: 'Última compra', value: (row: CustomerRankRow) => row.lastPurchaseAt, type: 'datetime' as const },
    ];
    await this.excel.export({
      fileName: 'reporte-clientes',
      title: 'Reporte de clientes',
      subtitle: this.state.exportContext(),
      sheets: [
        { name: 'Resumen', items: [
          { label: 'Clientes que compraron', value: summary.identifiedCustomers, type: 'integer', detail: `${summary.newCustomers} nuevos en el período` },
          { label: 'Venta con cliente registrado', value: summary.identifiedPercent, type: 'percent', detail: 'Del total vendido en el período' },
          { label: 'Monto con cliente registrado', value: summary.identifiedAmount, type: 'money', detail: `${summary.identifiedSales} ventas` },
          { label: 'Venta total', value: summary.totalAmount, type: 'money', detail: `${summary.totalSales} ventas` },
          { label: 'Ticket con cliente', value: summary.averageTicketIdentified, type: 'money' },
          { label: 'Ticket cliente general', value: summary.averageTicketGeneral, type: 'money' },
          { label: 'Clientes empresa', value: summary.businessCustomers, type: 'integer', detail: `${this.businessPercent()}% de la venta` },
          { label: 'Monto clientes empresa', value: summary.businessAmount, type: 'money' },
          { label: 'Dejaron de comprar', value: summary.lapsedCustomers, type: 'integer', detail: `Sin volver hace más de ${report.lapsedAfterDays} días` },
        ] },
        excelTable({ name: 'Clientes frecuentes', rows: report.frequent, totals: true, columns: rankColumns }),
        excelTable({ name: 'Dejaron de comprar', rows: report.lapsed, totals: true,
          note: `Compraron ${report.minPurchasesForLapsed} veces o más en los últimos ${report.lookbackDays} días y no vuelven hace más de ${report.lapsedAfterDays} días.`,
          columns: [
            { header: 'Cliente', value: (row) => row.name },
            { header: 'Documento', value: (row) => this.documentText(row) },
            { header: 'Teléfono', value: (row) => row.phone ?? '' },
            { header: 'Compras', value: (row) => row.purchases, type: 'integer' },
            { header: 'Monto', value: (row) => row.amount, type: 'money' },
            { header: 'Compraba cada (días)', value: (row) => row.averageDaysBetween, type: 'number', total: false },
            { header: 'Última compra', value: (row) => row.lastPurchaseAt, type: 'datetime' },
            { header: 'Días sin volver', value: (row) => row.daysSinceLastPurchase, type: 'integer', total: false },
          ] }),
        excelTable({ name: 'Clientes empresa', rows: report.business, totals: true, columns: rankColumns }),
      ],
    }, format);
    this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
  }
}

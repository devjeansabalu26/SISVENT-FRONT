import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import {
  CATEGORY_SHARE_MOCK,
  SALES_CHART_MOCK,
  SALES_REPORT_MOCK,
  SELLER_SHARE_MOCK,
  TOP_PRODUCT_MOCK,
} from '../data-access/sales-report.mock';
import { SalesReportRow } from '../models/sales-report.model';

@Component({
  selector: 'app-reports-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  readonly period = signal('6');
  readonly rows = computed(() => SALES_REPORT_MOCK.slice(-Number(this.period())));
  readonly chart = computed(() => SALES_CHART_MOCK.slice(-Number(this.period())));
  readonly maxAmount = computed(() => Math.max(...this.chart().map((point) => point.amount), 1));
  readonly revenue = computed(() => this.rows().reduce((sum, row) => sum + row.revenue, 0));
  readonly sales = computed(() => this.rows().reduce((sum, row) => sum + row.salesCount, 0));
  readonly averageTicket = computed(() => (this.sales() ? this.revenue() / this.sales() : 0));
  readonly unitsSold = computed(() => this.rows().reduce((sum, row) => sum + row.salesCount * 4, 0));

  readonly categoryShare = CATEGORY_SHARE_MOCK;
  readonly sellerShare = SELLER_SHARE_MOCK;
  readonly topProducts = TOP_PRODUCT_MOCK;

  readonly topProductColumns: readonly DataTableColumn<(typeof TOP_PRODUCT_MOCK)[number]>[] = [
    { key: 'rank', label: '#', value: (row) => row.rank },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'category', label: 'Categoría', value: (row) => row.category },
    { key: 'units', label: 'Unidades', value: (row) => row.units },
    { key: 'revenue', label: 'Ingresos', value: (row) => row.revenue },
    { key: 'margin', label: 'Margen', value: (row) => row.margin },
  ];

  readonly columns: readonly DataTableColumn<SalesReportRow>[] = [
    { key: 'period', label: 'Periodo', value: (row) => row.period },
    { key: 'sales', label: 'Ventas', value: (row) => row.salesCount },
    {
      key: 'revenue',
      label: 'Ingresos',
      value: (row) => `S/ ${row.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    },
    { key: 'ticket', label: 'Ticket promedio', value: (row) => `S/ ${row.averageTicket.toFixed(2)}` },
    { key: 'seller', label: 'Mejor vendedor', value: (row) => row.topSeller },
  ];

  exportCsv(): void {
    const lines = [
      'Periodo,Ventas,Ingresos,Ticket promedio,Mejor vendedor',
      ...this.rows().map(
        (row) => `${row.period},${row.salesCount},${row.revenue},${row.averageTicket},${row.topSeller}`,
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'reporte-ventas.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.notifications.show('Reporte exportado correctamente.', 'success');
  }
}

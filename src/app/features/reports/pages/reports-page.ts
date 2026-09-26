import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SalesReportApiService } from '../data-access/sales-report-api.service';
import { SalesReport, TopProduct } from '../models/sales-report.model';

type TopProductRow = TopProduct & { readonly id: string };

const PERIOD_DAYS: Readonly<Record<string, number>> = { '30': 30, '90': 90, '180': 180 };

@Component({
  selector: 'app-reports-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(SalesReportApiService);
  private readonly storeApi = inject(StoreApiService);

  readonly loading = signal(false);
  readonly period = signal('90');
  readonly storeId = signal('');
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly report = signal<SalesReport | null>(null);

  readonly maxAmount = computed(() =>
    Math.max(...(this.report()?.dailySeries.map((point) => point.amount) ?? [0]), 1),
  );

  readonly topProductColumns: readonly DataTableColumn<TopProductRow>[] = [
    { key: 'rank', label: '#', value: (row) => row.rank },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'category', label: 'Categoría', value: (row) => row.category ?? '—' },
    { key: 'units', label: 'Unidades', value: (row) => row.units },
    { key: 'revenue', label: 'Ingresos', value: (row) => `S/ ${row.revenue.toFixed(2)}` },
    { key: 'margin', label: 'Margen', value: (row) => (row.marginPercent != null ? `${row.marginPercent.toFixed(1)}%` : '—') },
  ];

  ngOnInit(): void {
    this.storeApi.list().subscribe((response) => this.stores.set(response.items));
    this.load();
  }

  onPeriodChange(value: string): void {
    this.period.set(value);
    this.load();
  }

  onStoreChange(value: string): void {
    this.storeId.set(value);
    this.load();
  }

  load(): void {
    const days = PERIOD_DAYS[this.period()] ?? 90;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    this.loading.set(true);
    this.api.get({ from: from.toISOString(), to: to.toISOString(), storeId: this.storeId() || undefined, topCount: 10 }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly topProductRows = computed<readonly TopProductRow[]>(() =>
    (this.report()?.topProducts ?? []).map((item) => ({ ...item, id: item.sku })),
  );

  exportCsv(): void {
    const report = this.report();
    if (!report) return;
    const lines = [
      'Fecha,Monto',
      ...report.dailySeries.map((point) => `${point.date},${point.amount}`),
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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { LoadState, ReplenishmentLoadState, loadStateFor } from '../components/load-state/load-state';
import { ReplenishmentApiService } from '../data-access/replenishment-api.service';
import { RISK_LABELS, RiskCode, StockRiskItem, StockoutRisk } from '../models/replenishment.model';
import { formatQuantity } from '../utils/replenishment-format';

type RiskRow = StockRiskItem & { readonly id: string };

@Component({
  selector: 'app-stockout-risk-page',
  imports: [DataTable, PageHeader, KpiCard, ReplenishmentLoadState],
  templateUrl: './stockout-risk-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockoutRiskPage implements OnInit {
  private readonly api = inject(ReplenishmentApiService);

  readonly state = signal<LoadState>('loading');
  readonly data = signal<StockoutRisk | null>(null);
  readonly riskFilter = signal<RiskCode | ''>('');
  readonly search = signal('');
  readonly riskOptions = Object.entries(RISK_LABELS) as [RiskCode, string][];

  readonly rows = computed<readonly RiskRow[]>(() => {
    const risk = this.riskFilter();
    const term = this.search().trim().toLowerCase();
    return (this.data()?.items ?? [])
      .filter((item) => !risk || item.risk === risk)
      .filter((item) => !term || `${item.sku} ${item.name}`.toLowerCase().includes(term))
      .map((item) => ({ ...item, id: item.productId }));
  });

  readonly columns: readonly DataTableColumn<RiskRow>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock', value: (row) => `${formatQuantity(row.currentStock)} uds` },
    { key: 'min', label: 'Mínimo', value: (row) => formatQuantity(row.minStock) },
    { key: 'avgSales', label: 'Ritmo de consumo', value: (row) => `${formatQuantity(row.averageDailySales)} uds/día` },
    { key: 'coverageDays', label: 'Cobertura', value: (row) => (row.coverageDays === null ? '—' : `${row.coverageDays} días`) },
    { key: 'suggested', label: 'Compra sugerida', value: (row) => (row.suggestedQuantity ? `${row.suggestedQuantity} uds` : '—') },
    { key: 'risk', label: 'Riesgo', value: (row) => RISK_LABELS[row.risk], type: 'status' },
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
}

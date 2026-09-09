import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CRITICAL_PRODUCT_MOCK } from '../data-access/replenishment.mock';
import { CriticalProduct } from '../models/replenishment.model';

@Component({
  selector: 'app-stockout-risk-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './stockout-risk-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockoutRiskPage {
  readonly riskFilter = signal('');
  private readonly products = signal<readonly CriticalProduct[]>(CRITICAL_PRODUCT_MOCK);

  readonly rows = computed(() => {
    const risk = this.riskFilter();
    return this.products().filter((item) => !risk || item.risk === risk);
  });

  readonly columns: readonly DataTableColumn<CriticalProduct>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock', value: (row) => `${row.stock} uds` },
    { key: 'avgSales', label: 'Ritmo de consumo', value: (row) => row.avgSales },
    { key: 'coverageDays', label: 'Cobertura', value: (row) => `${row.coverageDays} días` },
    { key: 'risk', label: 'Riesgo', value: (row) => row.risk, type: 'status' },
  ];
}

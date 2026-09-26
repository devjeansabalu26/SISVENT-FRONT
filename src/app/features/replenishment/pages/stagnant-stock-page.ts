import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { STAGNANT_KPI_MOCK, STAGNANT_PRODUCT_MOCK } from '../data-access/replenishment.mock';
import { StagnantProduct } from '../models/replenishment.model';

@Component({
  selector: 'app-stagnant-stock-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './stagnant-stock-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagnantStockPage {
  readonly rows = signal<readonly StagnantProduct[]>(STAGNANT_PRODUCT_MOCK);
  readonly kpis = STAGNANT_KPI_MOCK;

  readonly columns: readonly DataTableColumn<StagnantProduct>[] = [
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'stock', label: 'Stock', value: (row) => row.stock },
    { key: 'daysWithoutSale', label: 'Días sin vta', value: (row) => `${row.daysWithoutSale} d` },
    { key: 'value', label: 'Valor', value: (row) => row.value },
    { key: 'lastMovement', label: 'Último mov.', value: (row) => row.lastMovement },
    { key: 'cause', label: 'Causa', value: (row) => row.cause },
    { key: 'suggestedAction', label: 'Acción sugerida', value: (row) => row.suggestedAction, type: 'status' },
  ];
}

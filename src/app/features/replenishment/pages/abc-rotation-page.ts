import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ParetoChart } from '../components/pareto-chart/pareto-chart';
import { ABC_CLASS_MOCK, ABC_PRODUCT_MOCK, PARETO_CURVE_MOCK } from '../data-access/replenishment.mock';
import { AbcProduct } from '../models/replenishment.model';

@Component({
  selector: 'app-abc-rotation-page',
  imports: [DataTable, PageHeader, ParetoChart],
  templateUrl: './abc-rotation-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbcRotationPage {
  readonly rows = signal<readonly AbcProduct[]>(ABC_PRODUCT_MOCK);

  readonly classes = ABC_CLASS_MOCK;
  readonly paretoCurve = PARETO_CURVE_MOCK;
  readonly totalItems = ABC_CLASS_MOCK.reduce((sum, klass) => sum + klass.items, 0);

  readonly columns: readonly DataTableColumn<AbcProduct>[] = [
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'abcClass', label: 'Clase ABC', value: (row) => row.abcClass },
    { key: 'monthlySales', label: 'Ventas/mes', value: (row) => row.monthlySales },
    { key: 'rotation', label: 'Rotación', value: (row) => row.rotation },
    { key: 'margin', label: 'Margen %', value: (row) => row.margin },
    { key: 'revenue', label: 'Ingresos', value: (row) => row.revenue },
  ];
}

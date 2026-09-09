import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ABC_PRODUCT_MOCK } from '../data-access/replenishment.mock';
import { AbcProduct } from '../models/replenishment.model';

@Component({
  selector: 'app-abc-rotation-page',
  imports: [DataTable, PageHeader],
  templateUrl: './abc-rotation-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbcRotationPage {
  readonly rows = signal<readonly AbcProduct[]>(ABC_PRODUCT_MOCK);

  readonly classes: readonly { readonly name: string; readonly label: string; readonly share: string; readonly count: number }[] = [
    { name: 'Clase A', label: 'Alta rotación', share: '78%', count: 45 },
    { name: 'Clase B', label: 'Media rotación', share: '17%', count: 89 },
    { name: 'Clase C', label: 'Baja rotación', share: '5%', count: 150 },
  ];

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

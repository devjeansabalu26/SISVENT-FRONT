import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { INVENTORY_MOVEMENT_MOCK } from '../data-access/inventory-movement.mock';
import { InventoryMovement } from '../models/inventory-movement.model';

@Component({
  selector: 'app-inventory-movements-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './inventory-movements-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMovementsPage {
  readonly search = signal('');
  readonly typeFilter = signal('');
  private readonly movements = signal<readonly InventoryMovement[]>(INVENTORY_MOVEMENT_MOCK);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    return this.movements().filter((item) => {
      const matchesTerm = !term || `${item.productName} ${item.sku} ${item.code}`.toLowerCase().includes(term);
      return matchesTerm && (!type || item.type === type);
    });
  });

  readonly entries = computed(() => this.movements().filter((item) => item.type === 'Entrada').length);
  readonly exits = computed(() => this.movements().filter((item) => item.type === 'Salida').length);
  readonly adjustments = computed(() => this.movements().filter((item) => item.type === 'Ajuste').length);

  readonly columns: readonly DataTableColumn<InventoryMovement>[] = [
    { key: 'dateTime', label: 'Fecha / hora', value: (row) => row.dateTime },
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'type', label: 'Tipo', value: (row) => row.type },
    { key: 'productName', label: 'Producto', value: (row) => row.productName },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'quantity', label: 'Cantidad', value: (row) => (row.quantity > 0 ? `+${row.quantity}` : `${row.quantity}`) },
    { key: 'previousStock', label: 'S. anterior', value: (row) => row.previousStock },
    { key: 'newStock', label: 'S. nuevo', value: (row) => row.newStock },
    { key: 'reference', label: 'Referencia', value: (row) => row.reference },
    { key: 'user', label: 'Usuario', value: (row) => row.user },
  ];
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { InventoryApiService } from '../data-access/inventory-api.service';
import { InventoryMovement } from '../models/inventory-movement.model';

@Component({
  selector: 'app-inventory-movements-page',
  imports: [DataTable, PageHeader, KpiCard],
  templateUrl: './inventory-movements-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMovementsPage implements OnInit {
  private readonly api = inject(InventoryApiService);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly typeFilter = signal('');
  private readonly movements = signal<readonly InventoryMovement[]>([]);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    return this.movements().filter((item) => {
      const matchesTerm = !term || `${item.productName} ${item.sku} ${item.code}`.toLowerCase().includes(term);
      return matchesTerm && (!type || item.movementType === type);
    });
  });

  readonly types = computed(() => [...new Set(this.movements().map((item) => item.movementType))].sort());

  readonly entries = computed(() => this.movements().filter((item) => item.quantityDelta > 0).length);
  readonly exits = computed(() => this.movements().filter((item) => item.quantityDelta < 0).length);
  readonly adjustments = computed(() => this.movements().filter((item) => item.movementType.includes('ADJUSTMENT')).length);

  readonly columns: readonly DataTableColumn<InventoryMovement>[] = [
    { key: 'createdAt', label: 'Fecha / hora', value: (row) => new Date(row.createdAt).toLocaleString('es-PE') },
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'movementType', label: 'Tipo', value: (row) => row.movementType },
    { key: 'productName', label: 'Producto', value: (row) => row.productName },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'store', label: 'Local', value: (row) => row.storeName },
    { key: 'quantityDelta', label: 'Cantidad', value: (row) => (row.quantityDelta > 0 ? `+${row.quantityDelta}` : `${row.quantityDelta}`) },
    { key: 'stockBefore', label: 'S. anterior', value: (row) => row.stockBefore },
    { key: 'stockAfter', label: 'S. nuevo', value: (row) => row.stockAfter },
    { key: 'reason', label: 'Motivo', value: (row) => row.reason ?? '—' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.movements({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.movements.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

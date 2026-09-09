import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StockAdjustmentDialog } from '../components/stock-adjustment-dialog/stock-adjustment-dialog';
import { INVENTORY_MOCK } from '../data-access/inventory.mock';
import { InventoryItem, StockAdjustment } from '../models/inventory-item.model';

@Component({ selector: 'app-inventory-page', imports: [FormsModule, RouterLink, DataTable, PageHeader], templateUrl: './inventory-page.html', styleUrl: './inventory-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class InventoryPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly rows = signal<readonly InventoryItem[]>(INVENTORY_MOCK);
  readonly totalUnits = computed(() => this.rows().reduce((total, item) => total + item.stock, 0));
  readonly lowStock = computed(() => this.rows().filter((item) => item.status === 'LOW_STOCK').length);
  readonly outOfStock = computed(() => this.rows().filter((item) => item.status === 'OUT_OF_STOCK').length);
  readonly columns: readonly DataTableColumn<InventoryItem>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'product', label: 'Producto', value: (row) => row.productName },
    { key: 'category', label: 'Categoría', value: (row) => row.category },
    { key: 'warehouse', label: 'Ubicación', value: (row) => row.warehouse },
    { key: 'stock', label: 'Stock', value: (row) => row.stock },
    { key: 'minimum', label: 'Mínimo', value: (row) => row.minimumStock },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  filter(query: string, status: string): void {
    const value = query.trim().toLowerCase();
    this.rows.set(INVENTORY_MOCK.filter((item) => `${item.sku} ${item.productName}`.toLowerCase().includes(value) && (!status || item.status === status)));
  }

  adjust(item: InventoryItem): void {
    this.dialog.open<StockAdjustmentDialog, InventoryItem, StockAdjustment>(StockAdjustmentDialog, { data: item }).afterClosed().subscribe((movement) => {
      if (!movement) return;
      this.rows.update((rows) => rows.map((row) => row.id === item.id ? this.applyMovement(row, movement) : row));
      this.notifications.show('Inventario actualizado correctamente.', 'success');
    });
  }

  private applyMovement(item: InventoryItem, movement: StockAdjustment): InventoryItem {
    const stock = movement.type === 'IN' ? item.stock + movement.quantity : movement.type === 'OUT' ? Math.max(0, item.stock - movement.quantity) : movement.quantity;
    const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= item.minimumStock ? 'LOW_STOCK' : 'AVAILABLE';
    return { ...item, stock, status };
  }
}

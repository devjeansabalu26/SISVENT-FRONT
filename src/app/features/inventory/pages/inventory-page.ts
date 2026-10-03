import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { StockAdjustmentDialog } from '../components/stock-adjustment-dialog/stock-adjustment-dialog';
import { InventoryApiService } from '../data-access/inventory-api.service';
import { StockAdjustmentRequest, StockRow } from '../models/inventory-item.model';

@Component({
  selector: 'app-inventory-page',
  imports: [FormsModule, RouterLink, DataTable, PageHeader],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPage implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly canAdjust = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.inventoryAdjust] });

  readonly loading = signal(false);
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  private readonly search = signal('');
  private readonly statusFilter = signal('');
  private readonly rowsData = signal<readonly StockRow[]>([]);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.rowsData().filter(
      (row) =>
        (!term || `${row.sku} ${row.productName}`.toLowerCase().includes(term)) &&
        (!status || row.status === status),
    );
  });

  readonly totalUnits = computed(() => this.rowsData().reduce((total, item) => total + item.currentStock, 0));
  readonly lowStock = computed(() => this.rowsData().filter((item) => item.status === 'LOW_STOCK').length);
  readonly outOfStock = computed(() => this.rowsData().filter((item) => item.status === 'OUT_OF_STOCK').length);

  readonly columns: readonly DataTableColumn<StockRow>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'product', label: 'Producto', value: (row) => row.productName },
    { key: 'store', label: 'Local', value: (row) => row.storeName },
    { key: 'stock', label: 'Stock', value: (row) => row.currentStock },
    { key: 'minimum', label: 'Mínimo', value: (row) => row.minStock },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  ngOnInit(): void {
    this.storeApi.list().subscribe((response) => this.stores.set(response.items));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.stock({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.rowsData.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filter(query: string, status: string): void {
    this.search.set(query);
    this.statusFilter.set(status);
  }

  adjust(item: StockRow): void {
    this.dialog
      .open<StockAdjustmentDialog, StockRow, StockAdjustmentRequest>(StockAdjustmentDialog, { data: item })
      .afterClosed()
      .subscribe((request) => {
        if (!request) return;
        this.api.adjust(request).subscribe({
          next: () => {
            this.notifications.show('Inventario actualizado correctamente.', 'success');
            this.load();
          },
          error: (cause: unknown) => {
            const message =
              cause instanceof AppHttpError && cause.status === 409
                ? 'El ajuste dejaría el stock en negativo o el registro cambió.'
                : 'No se pudo registrar el ajuste.';
            this.notifications.show(message, 'error');
          },
        });
      });
  }
}

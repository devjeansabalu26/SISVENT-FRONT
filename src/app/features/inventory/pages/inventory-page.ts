import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { ProductApiService } from '../../products/data-access/product-api.service';
import { Product } from '../../products/models/product.model';
import { StockTransferData, StockTransferDialog } from '../components/stock-transfer-dialog/stock-transfer-dialog';
import { StockTransferResult } from '../data-access/inventory-api.service';
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
export class InventoryPage {
  private readonly api = inject(InventoryApiService);
  private readonly productApi = inject(ProductApiService);
  /** Local del encabezado: con local, el stock de ese local; sin local (ADMIN), el stock general por local. */
  readonly storeContext = inject(StoreContextService);
  private readonly ownStoreId = inject(UserContextService).user()?.branchId ?? null;
  readonly general = computed(() => this.storeContext.canPick() && !this.storeContext.selectedStoreId());
  /** Ajustar: el ADMIN en cualquier local; el vendedor solo en su local (consultar otros no permite ajustarlos). */
  readonly canAdjustHere = computed(() =>
    this.canAdjust && (this.storeContext.isAdmin() || this.storeContext.selectedStoreId() === this.ownStoreId));
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly canAdjust = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.inventoryAdjust] });

  readonly loading = signal(false);
  /** Vista general: una fila por producto con total y columna por local. */
  private readonly generalData = signal<readonly Product[]>([]);
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

  readonly generalRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.generalData().filter(
      (row) =>
        (!term || `${row.sku} ${row.name}`.toLowerCase().includes(term)) && (!status || this.generalStatus(row) === status),
    );
  });

  readonly totalUnits = computed(() =>
    this.general()
      ? this.generalData().reduce((total, item) => total + item.totalStock, 0)
      : this.rowsData().reduce((total, item) => total + item.currentStock, 0));
  readonly lowStock = computed(() =>
    this.general()
      ? this.generalData().filter((item) => this.generalStatus(item) === 'LOW_STOCK').length
      : this.rowsData().filter((item) => item.status === 'LOW_STOCK').length);
  readonly outOfStock = computed(() =>
    this.general()
      ? this.generalData().filter((item) => this.generalStatus(item) === 'OUT_OF_STOCK').length
      : this.rowsData().filter((item) => item.status === 'OUT_OF_STOCK').length);

  /** Columnas de la vista general: total y una por local. */
  readonly generalColumns = computed<readonly DataTableColumn<Product>[]>(() => [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'product', label: 'Producto', value: (row) => row.name },
    { key: 'total', label: 'Stock total', value: (row) => row.totalStock },
    ...this.storeContext.stores().map((store) => ({
      key: `store-${store.id}`,
      label: store.name,
      value: (row: Product) => {
        const cell = row.stores?.find((s) => s.storeId === store.id);
        return cell ? cell.currentStock : '—';
      },
    })),
    { key: 'status', label: 'Estado', value: (row) => this.generalStatus(row), type: 'status' as const },
  ]);

  readonly columns: readonly DataTableColumn<StockRow>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'product', label: 'Producto', value: (row) => row.productName },
    { key: 'store', label: 'Local', value: (row) => row.storeName },
    { key: 'stock', label: 'Stock', value: (row) => row.currentStock },
    { key: 'minimum', label: 'Mínimo', value: (row) => row.minStock },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  constructor() {
    // Recarga al cambiar el local del encabezado (y la primera vez).
    effect(() => {
      this.storeContext.selectedStoreId();
      this.general();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.loading.set(true);
    if (this.general()) {
      this.productApi.list({ pageSize: 100, isActive: true }).subscribe({
        next: (page) => {
          this.generalData.set(page.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }
    this.api.stock({ pageSize: 100, storeId: this.storeContext.selectedStoreId() ?? undefined }).subscribe({
      next: (page) => {
        this.rowsData.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  transfer(): void {
    this.dialog
      .open<StockTransferDialog, StockTransferData, StockTransferResult>(StockTransferDialog, {
        data: { stores: this.storeContext.stores(), fromStoreId: this.storeContext.selectedStoreId() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.notifications.show(
          `Transferidas ${result.units} unidades de ${result.fromStoreName} a ${result.toStoreName}.`, 'success');
        this.load();
      });
  }

  private generalStatus(row: Product): string {
    return row.totalStock <= 0 ? 'OUT_OF_STOCK' : row.lowStock ? 'LOW_STOCK' : 'AVAILABLE';
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

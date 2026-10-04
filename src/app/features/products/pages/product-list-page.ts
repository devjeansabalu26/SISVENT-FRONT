import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { BrandApiService } from '../../brands/data-access/brand-api.service';
import { CategoryApiService } from '../../categories/data-access/category-api.service';
import { withParentLabel } from '../../categories/utils/category-label';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { productStatusReview } from '../../../shared/ui/review-dialog/status-reviews';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { ProductApiService } from '../data-access/product-api.service';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-list-page',
  imports: [FormsModule, DataTable, EmptyState, PageHeader, Paginator, RouterLink],
  templateUrl: './product-list-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './product-list-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly brandApi = inject(BrandApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  readonly storeContext = inject(StoreContextService);

  readonly loading = signal(false);
  readonly isSeller = !inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.productsManage] });

  readonly search = signal('');
  readonly categoryFilter = signal('');
  readonly brandFilter = signal('');
  readonly statusFilter = signal('');
  readonly lowStockOnly = signal(false);
  readonly hasFilters = computed(
    () => !!(this.search().trim() || this.categoryFilter() || this.brandFilter() || this.statusFilter() || this.lowStockOnly()),
  );

  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly Product[]>([]);

  readonly categories = signal<readonly { id: string; name: string }[]>([]);
  readonly brands = signal<readonly { id: string; name: string }[]>([]);

  readonly columns = computed<readonly DataTableColumn<Product>[]>(() => {
    const general = !this.storeContext.selectedStoreId();
    const base: DataTableColumn<Product>[] = [
      { key: 'sku', label: 'SKU', value: (r) => r.sku },
      { key: 'name', label: 'Producto', value: (r) => r.name },
      { key: 'category', label: 'Categoría', value: (r) => r.categoryName ?? '—' },
      { key: 'brand', label: 'Marca', value: (r) => r.brandName ?? '—' },
      { key: 'price', label: 'Precio', value: (r) => `S/ ${r.salePrice.toFixed(2)}` },
      { key: 'status', label: 'Estado', value: (r) => (r.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
      {
        key: 'stock', label: general ? 'Stock total' : 'Stock del local',
        value: (r) => (r.lowStock ? `⚠ ${r.totalStock}` : `${r.totalStock}`),
      },
    ];
    if (general && this.storeContext.canPick())
      base.push({
        key: 'byStore', label: 'Por local',
        value: (r) => (r.stores ?? []).map((s) => `${s.storeName}: ${s.currentStock}`).join(' · ') || 'Sin stock en locales',
      });
    return base;
  });

  constructor() {
    effect(() => {
      this.storeContext.selectedStoreId();
      untracked(() => {
        this.pageNumber.set(1);
        this.load();
      });
    });
  }

  ngOnInit(): void {
    this.categoryApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.categories.set(withParentLabel(page.items)));
    this.brandApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.brands.set(page.items));
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize,
        search: this.search().trim() || undefined,
        categoryId: this.categoryFilter() || undefined,
        brandId: this.brandFilter() || undefined,
        storeId: this.storeContext.selectedStoreId(),
        isActive: this.statusFilter() ? this.statusFilter() === 'ACTIVE' : undefined,
        lowStock: this.lowStockOnly() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
          this.total.set(page.totalCount);
          this.loading.set(false);
        },
        error: (cause: unknown) => {
          this.loading.set(false);
          this.notifications.show(this.messageFor(cause, 'No se pudieron cargar los productos.'), 'error');
        },
      });
  }

  selectCategory(categoryId: string): void {
    this.categoryFilter.set(categoryId);
    this.applyFilters();
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.load();
  }

  create(): void {
    void this.router.navigate(['/app/products/new']);
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set('');
    this.brandFilter.set('');
    this.statusFilter.set('');
    this.lowStockOnly.set(false);
    this.pageNumber.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  view(product: Product): void {
    void this.router.navigate(['/app/products', product.id]);
  }

  edit(product: Product): void {
    void this.router.navigate(['/app/products', product.id, 'edit']);
  }

  onMenuAction(event: { action: string; row: Product }): void {
    if (event.action === 'toggle') this.toggle(event.row);
  }

  private toggle(product: Product): void {
    const deactivate = product.isActive;
    this.dialog
      .open(ReviewDialog, { data: productStatusReview(product, deactivate) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        const request = deactivate ? this.api.deactivate(product.id, product.version) : this.api.activate(product.id, product.version);
        request.subscribe({
          next: () => {
            this.notifications.show(`Producto ${deactivate ? 'desactivado' : 'activado'}.`, 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(this.messageFor(cause, `No se pudo ${deactivate ? 'desactivar' : 'activar'} el producto.`), 'error');
            if (cause instanceof AppHttpError && cause.status === 409) this.load();
          },
        });
      });
  }

  private messageFor(cause: unknown, fallback: string): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'Conflicto: el registro cambió. Se recargó la lista.';
      if (cause.status === 403) return 'No tienes permiso para gestionar productos.';
      if (cause.status === 400) return 'Revisa los filtros ingresados.';
    }
    return fallback;
  }
}

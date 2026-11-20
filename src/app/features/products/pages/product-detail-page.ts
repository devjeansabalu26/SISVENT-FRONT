import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { productStatusReview } from '../../../shared/ui/review-dialog/status-reviews';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { ProductApiService } from '../data-access/product-api.service';
import { ProductDetail, ProductPriceHistoryItem } from '../models/product.model';
import { DateTimePipe, MoneyPipe, ShortDatePipe } from '../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-product-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink, MoneyPipe, DateTimePipe, ShortDatePipe],
  templateUrl: './product-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './product-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly canManage = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.productsManage] });
  readonly storeContext = inject(StoreContextService);

  readonly loading = signal(true);
  readonly product = signal<ProductDetail | null>(null);
  readonly priceHistory = signal<readonly ProductPriceHistoryItem[]>([]);

  readonly margin = computed(() => {
    const product = this.product();
    if (!product?.referenceCost || product.referenceCost <= 0 || product.salePrice <= 0) return '—';
    return `${(((product.salePrice - product.referenceCost) / product.salePrice) * 100).toFixed(1)}%`;
  });

  readonly storeStock = computed(() => {
    const product = this.product();
    if (!product) return null;
    const storeId = this.storeContext.selectedStoreId();
    if (!storeId) return { label: 'Stock en todos los locales', current: product.totalStock, min: product.minStock };
    const row = product.stores?.find((s) => s.storeId === storeId);
    const name = this.storeContext.selectedStore()?.name ?? row?.storeName ?? 'este local';
    return { label: `Stock en ${name}`, current: row?.currentStock ?? 0, min: row?.minStock ?? 0 };
  });

  readonly missingIn = computed(() => {
    const product = this.product();
    const storeId = this.storeContext.selectedStoreId();
    if (!product || !storeId) return null;
    const row = product.stores?.find((s) => s.storeId === storeId);
    if (row && row.currentStock > 0) return null;
    const name = this.storeContext.selectedStore()?.name ?? 'este local';
    return row ? `Este producto está agotado en ${name}.` : `Este producto no está registrado en ${name}.`;
  });

  readonly storeRows = computed(() => (this.storeContext.selectedStoreId() ? [] : (this.product()?.stores ?? [])));

  ngOnInit(): void {
    this.storeContext.load();
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.get(this.id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar el producto.', 'error');
      },
    });
    this.api.priceHistory(this.id).subscribe({
      next: (history) => this.priceHistory.set(history),
      error: () => undefined,
    });
  }

  toggleActive(): void {
    const product = this.product();
    if (!product) return;
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
            const message =
              cause instanceof AppHttpError && cause.status === 409
                ? 'El producto cambió mientras tanto. Se recargó la información.'
                : `No se pudo ${deactivate ? 'desactivar' : 'activar'} el producto.`;
            this.notifications.show(message, 'error');
            this.load();
          },
        });
      });
  }
}

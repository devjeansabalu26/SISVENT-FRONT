import { DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-product-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink, DatePipe],
  templateUrl: './product-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './product-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly product = signal<ProductDetail | null>(null);
  readonly priceHistory = signal<readonly ProductPriceHistoryItem[]>([]);

  readonly specs = computed(() => {
    const product = this.product();
    if (!product) return [];
    return [
      { label: 'Descripción', value: product.description ?? '—' },
      { label: 'Categoría', value: product.categoryName ?? '—' },
      { label: 'Marca', value: product.brandName ?? '—' },
      { label: 'Unidad', value: product.unitName ?? '—' },
    ];
  });

  readonly finance = computed(() => {
    const product = this.product();
    if (!product) return [];
    const margin =
      product.referenceCost && product.referenceCost > 0
        ? `${(((product.salePrice - product.referenceCost) / product.salePrice) * 100).toFixed(1)}%`
        : '—';
    return [
      { label: 'Costo de referencia', value: product.referenceCost != null ? `S/ ${product.referenceCost.toFixed(2)}` : '—' },
      { label: 'Precio de venta', value: `S/ ${product.salePrice.toFixed(2)}` },
      { label: 'Margen de utilidad', value: margin },
    ];
  });

  readonly stock = computed(() => {
    const product = this.product();
    if (!product) return [];
    return [
      { label: 'Stock actual', value: `${product.totalStock}` },
      { label: 'Stock mínimo', value: `${product.minStock}` },
      { label: 'SKU', value: product.sku },
    ];
  });

  ngOnInit(): void {
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

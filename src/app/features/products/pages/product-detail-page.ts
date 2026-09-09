import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { PRODUCT_MOCK } from '../data-access/product.mock';
import { ProductListItem } from '../models/product.model';

interface StockMovement {
  readonly date: string;
  readonly type: string;
  readonly quantity: number;
  readonly reference: string;
}

@Component({
  selector: 'app-product-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './product-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly product: ProductListItem = PRODUCT_MOCK.find((item) => item.id === this.id) ?? PRODUCT_MOCK[0];

  readonly specs: readonly { label: string; value: string }[] = [
    { label: 'Descripción', value: 'Mouse ergonómico para gaming con sensor óptico de alta precisión e iluminación RGB personalizable.' },
    { label: 'Categoría', value: `${this.product.category} > Mouse` },
    { label: 'Marca', value: this.product.brand },
    { label: 'Código de barras', value: '7501234567890' },
  ];

  readonly finance: readonly { label: string; value: string }[] = [
    { label: 'Precio de compra', value: 'S/ 65.00' },
    { label: 'Precio de venta', value: `S/ ${this.product.price.toFixed(2)}` },
    { label: 'Margen de utilidad', value: '53.7% (Alto)' },
  ];

  readonly stock: readonly { label: string; value: string }[] = [
    { label: 'Stock actual', value: `${this.product.stock}` },
    { label: 'Stock mínimo', value: '10' },
    { label: 'Unidad', value: 'Unidad' },
    { label: 'Nivel de inventario', value: 'Saludable (Normal)' },
  ];

  readonly movements: readonly StockMovement[] = [
    { date: '18/08 14:20', type: 'Venta', quantity: -1, reference: 'POS #1024' },
    { date: '17/08 09:15', type: 'Venta', quantity: -2, reference: 'POS #1012' },
    { date: '15/08 11:30', type: 'Ajuste', quantity: 10, reference: 'Ingreso Manual' },
    { date: '10/08 10:00', type: 'Venta', quantity: -5, reference: 'POS #985' },
  ];

  toggleActive(): void {
    this.notifications.show(
      this.product.status === 'ACTIVE' ? 'Producto desactivado.' : 'Producto activado.',
      'success',
    );
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { SaleSuccessDialog } from '../components/sale-success-dialog/sale-success-dialog';
import { PRODUCT_MOCK } from '../../products/data-access/product.mock';
import { ProductListItem } from '../../products/models/product.model';
import { CartItem, PaymentMethod } from '../models/cart-item.model';

const PAYMENT_LABELS: Readonly<Record<PaymentMethod, string>> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFER: 'Transferencia',
};

@Component({
  selector: 'app-pos-page',
  imports: [RouterLink],
  templateUrl: './pos-page.html',
  styleUrl: './pos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly paymentMethods: readonly PaymentMethod[] = ['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER'];
  readonly products = signal(PRODUCT_MOCK.filter((product) => product.status === 'ACTIVE'));
  readonly cart = signal<readonly CartItem[]>([]);
  readonly payment = signal<PaymentMethod>('CASH');
  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  search(query: string): void {
    const value = query.trim().toLowerCase();
    this.products.set(PRODUCT_MOCK.filter((product) => product.status === 'ACTIVE' && `${product.name} ${product.sku}`.toLowerCase().includes(value)));
  }

  add(product: ProductListItem): void {
    this.cart.update((items) => {
      const found = items.find((item) => item.product.id === product.id);
      return found ? items.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...items, { product, quantity: 1 }];
    });
  }

  change(id: string, step: number): void {
    this.cart.update((items) => items.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(item.quantity + step, item.product.stock)) } : item));
  }

  remove(id: string): void {
    this.cart.update((items) => items.filter((item) => item.product.id !== id));
  }

  confirm(): void {
    if (!this.cart().length) {
      this.notifications.show('Agrega al menos un producto.', 'warning');
      return;
    }
    const total = this.subtotal();
    const saleNumber = `V-${String(Math.floor(1000 + Math.random() * 9000))}`;
    this.dialog
      .open(SaleSuccessDialog, {
        data: {
          saleNumber,
          customer: 'Cliente General',
          paymentMethod: PAYMENT_LABELS[this.payment()],
          total,
        },
      })
      .afterClosed()
      .subscribe((action) => {
        this.cart.set([]);
        const id = saleNumber.replace('V-', '');
        if (action === 'print') void this.router.navigate(['/app/sales', id, 'comprobante']);
        else if (action === 'detail') void this.router.navigate(['/app/sales', id]);
      });
  }
}

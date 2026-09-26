import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CustomerQuickDialog } from '../../customers/components/customer-quick-dialog/customer-quick-dialog';
import { Customer } from '../../customers/models/customer.model';
import { toCustomer } from '../../customers/utils/to-customer';
import { CustomerApiService } from '../../customers/data-access/customer-api.service';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { Product } from '../../products/models/product.model';
import { ProductApiService } from '../../products/data-access/product-api.service';
import { SaleConfirmData, SaleConfirmDialog } from '../components/sale-confirm-dialog/sale-confirm-dialog';
import { SaleSuccessDialog } from '../components/sale-success-dialog/sale-success-dialog';
import { PosApiService } from '../data-access/pos-api.service';
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
  imports: [],
  templateUrl: './pos-page.html',
  styleUrl: './pos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly productApi = inject(ProductApiService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly posApi = inject(PosApiService);
  private readonly userContext = inject(UserContextService);

  readonly isAdmin = this.userContext.user()?.role === 'ADMIN';
  readonly paymentMethods: readonly PaymentMethod[] = ['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER'];
  readonly paymentLabels = PAYMENT_LABELS;

  readonly products = signal<readonly Product[]>([]);
  readonly cart = signal<readonly CartItem[]>([]);
  readonly payment = signal<PaymentMethod>('CASH');
  readonly saving = signal(false);

  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly selectedStoreId = signal<string | null>(null);

  readonly customerResults = signal<readonly Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0),
  );

  ngOnInit(): void {
    this.search('');
    const clientId = this.route.snapshot.queryParamMap.get('clientId');
    if (clientId) {
      this.customerApi.get(clientId).subscribe({
        next: (detail) => this.selectCustomer(toCustomer(detail)),
        error: () => this.notifications.show('No se pudo cargar el cliente seleccionado.', 'error'),
      });
    }
    if (this.isAdmin) {
      this.storeApi.list().subscribe((response) => {
        this.stores.set(response.items);
        if (response.items.length) this.selectedStoreId.set(response.items[0].id);
      });
    }
  }

  search(query: string): void {
    this.productApi.list({ pageSize: 30, search: query || undefined, isActive: true }).subscribe((page) => {
      this.products.set(page.items);
    });
  }

  searchCustomer(query: string): void {
    const term = query.trim();
    if (!term) {
      this.customerResults.set([]);
      return;
    }
    this.customerApi.list({ pageSize: 10, search: term, isActive: true }).subscribe((page) => this.customerResults.set(page.items));
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerResults.set([]);
  }

  /** `mod-crear-cliente`: alta rápida sin abandonar la venta en curso; el cliente creado queda seleccionado. */
  newCustomer(): void {
    this.dialog
      .open<CustomerQuickDialog, void, Customer>(CustomerQuickDialog)
      .afterClosed()
      .pipe(filter((customer): customer is Customer => !!customer))
      .subscribe((customer) => {
        this.notifications.show('Cliente registrado.', 'success');
        this.selectCustomer(customer);
      });
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
  }

  add(product: Product): void {
    this.cart.update((items) => {
      const found = items.find((item) => item.product.id === product.id);
      return found
        ? items.map((item) =>
            item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.totalStock) } : item,
          )
        : [...items, { product, quantity: 1 }];
    });
  }

  change(id: string, step: number): void {
    this.cart.update((items) =>
      items.map((item) =>
        item.product.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.quantity + step, item.product.totalStock)) }
          : item,
      ),
    );
  }

  remove(id: string): void {
    this.cart.update((items) => items.filter((item) => item.product.id !== id));
  }

  /** MOD-AD-18: resumen del carrito antes de registrar la venta. */
  confirm(): void {
    if (!this.cart().length) {
      this.notifications.show('Agrega al menos un producto.', 'warning');
      return;
    }
    const customer = this.selectedCustomer();
    this.dialog
      .open<SaleConfirmDialog, SaleConfirmData, boolean>(SaleConfirmDialog, {
        data: {
          customer: customer
            ? `${customer.displayName}${customer.documentNumber ? ` (${customer.documentType ?? 'Doc.'} ${customer.documentNumber})` : ''}`
            : 'Cliente general',
          lines: this.cart().map((item) => ({ name: item.product.name, quantity: item.quantity, unitPrice: item.product.salePrice })),
          discount: 0,
          paymentMethod: PAYMENT_LABELS[this.payment()],
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.register());
  }

  private register(): void {
    this.saving.set(true);
    this.posApi
      .confirm({
        storeId: this.isAdmin ? this.selectedStoreId() : null,
        clientId: this.selectedCustomer()?.id ?? null,
        paymentMethod: this.payment(),
        discountTotal: 0,
        notes: null,
        lines: this.cart().map((item) => ({ productId: item.product.id, quantity: item.quantity, discountAmount: 0 })),
      })
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.dialog
            .open(SaleSuccessDialog, {
              data: {
                saleNumber: sale.saleNumber,
                customer: sale.clientName ?? 'Cliente general',
                paymentMethod: PAYMENT_LABELS[this.payment()],
                total: sale.total,
              },
            })
            .afterClosed()
            .subscribe((action) => {
              this.cart.set([]);
              this.selectedCustomer.set(null);
              if (action === 'print') void this.router.navigate(['/app/sales', sale.id, 'comprobante']);
              else if (action === 'detail') void this.router.navigate(['/app/sales', sale.id]);
            });
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          const message =
            cause instanceof AppHttpError && cause.status === 409
              ? 'Conflicto: revisa el stock o el método de pago seleccionado.'
              : 'No se pudo registrar la venta.';
          this.notifications.show(message, 'error');
        },
      });
  }
}

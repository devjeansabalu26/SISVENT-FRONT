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
import { ReceiptMailerService } from '../data-access/receipt-mailer.service';
import { PosPaymentPanel } from '../components/pos-payment-panel/pos-payment-panel';
import { CartItem } from '../models/cart-item.model';
import { PaymentDraftLine, PaymentKind, PaymentMethodOption, newPaymentLine } from '../models/payment.model';
import { breakdown, paymentSummary, paymentsError, toPaymentLines } from '../utils/payment';

@Component({
  selector: 'app-pos-page',
  imports: [PosPaymentPanel],
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
  private readonly receiptMailer = inject(ReceiptMailerService);
  private readonly userContext = inject(UserContextService);

  readonly isAdmin = this.userContext.user()?.role === 'ADMIN';
  /** Métodos activos de la empresa (GET /pos/payment-methods). */
  readonly paymentMethods = signal<readonly PaymentMethodOption[]>([]);
  readonly paymentMethodsError = signal(false);

  readonly products = signal<readonly Product[]>([]);
  readonly cart = signal<readonly CartItem[]>([]);
  /** Pagos de la venta: uno o varios métodos (p. ej. tarjeta + efectivo). */
  readonly paymentLines = signal<readonly PaymentDraftLine[]>([]);
  /** Método del primer pago: lo marcan los botones rápidos cuando hay un solo pago. */
  readonly payment = computed(() => this.paymentLines()[0]?.methodCode ?? '');
  /** Los errores del pago se muestran recién al intentar confirmar. */
  readonly showPaymentErrors = signal(false);
  readonly selectedMethod = computed(() => this.paymentMethods().find((method) => method.code === this.payment()) ?? null);
  readonly kindOf = (code: string): PaymentKind => this.paymentMethods().find((method) => method.code === code)?.kind ?? 'DIGITAL';
  private readonly methodName = (code: string): string => this.paymentMethods().find((method) => method.code === code)?.name ?? code;
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
    this.loadPaymentMethods();
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

  loadPaymentMethods(): void {
    this.paymentMethodsError.set(false);
    this.posApi.paymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods.set(methods);
        if (!methods.some((method) => method.code === this.payment())) this.selectPayment(methods[0]?.code ?? '');
      },
      error: () => this.paymentMethodsError.set(true),
    });
  }

  /** Botones rápidos: un solo pago con el método elegido (limpia los pagos anteriores). */
  selectPayment(code: string): void {
    this.paymentLines.set(code ? [newPaymentLine(code)] : []);
    this.showPaymentErrors.set(false);
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
    if (!this.paymentMethods().length) {
      this.notifications.show('Tu empresa no tiene métodos de pago habilitados.', 'error');
      return;
    }
    const total = this.subtotal();
    const error = paymentsError(this.paymentLines(), this.kindOf, total);
    if (error) {
      this.showPaymentErrors.set(true);
      this.notifications.show(error, 'warning');
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
          paymentMethod: this.paymentLines().map((line) => this.methodName(line.methodCode)).join(' + '),
          paymentDetails: this.previewPayments(total),
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.register());
  }

  /** Resumen de cada pago antes de confirmar ("Tarjeta S/ 6000.00 · Op. 004512"). */
  private previewPayments(total: number): readonly string[] {
    const lines = this.paymentLines();
    const due = breakdown(lines, this.kindOf, total).due;
    return toPaymentLines(lines, this.kindOf, total).map((payment) => {
      const isCash = this.kindOf(payment.method) === 'CASH';
      return paymentSummary({
        methodName: this.methodName(payment.method),
        amount: isCash ? due : payment.amount,
        amountReceived: isCash ? payment.amountReceived : null,
        changeAmount: isCash ? Math.max(0, (payment.amountReceived ?? due) - due) : null,
        reference: payment.reference,
        authorizationCode: payment.authorizationCode,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
      });
    });
  }

  private register(): void {
    const total = this.subtotal();
    const payments = toPaymentLines(this.paymentLines(), this.kindOf, total);
    if (!payments.length) return;
    this.saving.set(true);
    this.posApi
      .confirm({
        storeId: this.isAdmin ? this.selectedStoreId() : null,
        clientId: this.selectedCustomer()?.id ?? null,
        paymentMethod: payments[0].method,
        discountTotal: 0,
        notes: null,
        lines: this.cart().map((item) => ({ productId: item.product.id, quantity: item.quantity, discountAmount: 0 })),
        payments,
      })
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.dialog
            .open(SaleSuccessDialog, {
              data: {
                saleNumber: sale.saleNumber,
                customer: sale.clientName ?? 'Cliente general',
                paymentMethod: sale.paymentMethod,
                total: sale.total,
                change: sale.changeAmount ?? breakdown(this.paymentLines(), this.kindOf, total).change,
                paymentDetails: (sale.payments ?? []).map((payment) => paymentSummary(payment)),
                clientEmail: sale.clientEmail ?? null,
              },
            })
            .afterClosed()
            .subscribe((action) => {
              this.cart.set([]);
              this.selectedCustomer.set(null);
              this.selectPayment(this.paymentMethods()[0]?.code ?? '');
              if (action === 'print') void this.router.navigate(['/app/sales', sale.id, 'comprobante']);
              else if (action === 'detail') void this.router.navigate(['/app/sales', sale.id]);
              // El POS queda listo para la siguiente venta mientras se confirma el destinatario.
              else if (action === 'email') this.receiptMailer.send(sale);
            });
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          // El backend explica el motivo en el title (stock insuficiente, monto recibido, n.º de operación…).
          const title = (cause instanceof AppHttpError
            ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
            : undefined);
          const message =
            cause instanceof AppHttpError && (cause.status === 400 || cause.status === 409) && typeof title?.title === 'string' && !title.errors
              ? title.title
              : 'No se pudo registrar la venta.';
          this.notifications.show(message, 'error');
        },
      });
  }
}

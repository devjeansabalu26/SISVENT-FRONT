import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { formatMoney } from '../../../core/regional/regional-format';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, timeout } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CustomerQuickDialog } from '../../customers/components/customer-quick-dialog/customer-quick-dialog';
import { CustomerEditDialog, CustomerEditDialogData } from '../../customers/components/customer-edit-dialog/customer-edit-dialog';
import { Customer } from '../../customers/models/customer.model';
import { toCustomer } from '../../customers/utils/to-customer';
import { CustomerApiService } from '../../customers/data-access/customer-api.service';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { Product } from '../../products/models/product.model';
import { ProductApiService } from '../../products/data-access/product-api.service';
import { SaleConfirmData, SaleConfirmDialog, SaleConfirmResult, SaleConfirmSeller } from '../components/sale-confirm-dialog/sale-confirm-dialog';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { PLAN_FEATURES } from '../../../core/auth/constants/plan-features.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { AttendanceApiService, attendanceErrorMessage } from '../../attendance/data-access/attendance-api.service';
import { AttendanceMarkDialog, AttendanceMarkDialogData } from '../../attendance/components/attendance-mark-dialog/attendance-mark-dialog';
import { AttendanceStatus } from '../../attendance/models/attendance.model';
import { SaleSuccessDialog } from '../components/sale-success-dialog/sale-success-dialog';
import { PosApiService, PosSaleRequest, PosSettings } from '../data-access/pos-api.service';
import { CashSessionApiService, StoreCashStatus } from '../data-access/cash-session-api.service';
import { canUseCash } from '../cash-access';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { SaleDetail } from '../models/sale-detail.model';
import { ReceiptMailerService } from '../data-access/receipt-mailer.service';
import { PosPaymentPanel } from '../components/pos-payment-panel/pos-payment-panel';
import { CartItem } from '../models/cart-item.model';
import { PaymentDraftLine, PaymentKind, PaymentMethodOption, newPaymentLine } from '../models/payment.model';
import { breakdown, paymentSummary, paymentsError, toPaymentLines } from '../utils/payment';
import { PendingSale, SALE_CONFIRM_TIMEOUT_MS, isUncertainSaleFailure, pendingSaleFor } from '../utils/pending-sale';
import { MoneyPipe } from '../../../shared/pipes/date-time.pipe';
import { INVOICE_FEATURE, documentNumber, isInvoice, isValidRuc } from '../utils/sale-document';
import { SoundService } from '../../../core/sound/sound.service';
import { WholesalePrice, WholesalePriceApiService, wholesaleTotal } from '../../products/data-access/wholesale-price-api.service';

const QUICK_METHODS: readonly string[] = ['CASH', 'YAPE', 'CARD'];
const SCAN_KEY_GAP_MS = 45;
const SCAN_MIN_LENGTH = 4;
const SCAN_IDLE_MS = 120;
const ATTENDANCE_FRESH_MS = 60_000;

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

@Component({
  selector: 'app-pos-page',
  host: { '(document:keydown)': 'onGlobalKey($event)' },
  imports: [PosPaymentPanel, RouterLink, MoneyPipe],
  templateUrl: './pos-page.html',
  styleUrls: ['./pos-page.scss', './pos-wholesale.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly sound = inject(SoundService);
  private readonly productApi = inject(ProductApiService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly posApi = inject(PosApiService);
  private readonly receiptMailer = inject(ReceiptMailerService);
  private readonly userContext = inject(UserContextService);
  private readonly attendanceApi = inject(AttendanceApiService);
  private readonly access = inject(AccessControlService);
  private readonly usesAttendance = this.access.canAccess({ permissions: [APP_PERMISSIONS.attendanceView] });

  readonly isAdmin = this.userContext.user()?.role === 'ADMIN';
  readonly paymentMethods = signal<readonly PaymentMethodOption[]>([]);
  readonly paymentMethodsError = signal(false);

  readonly catalog = signal<readonly Product[]>([]);
  readonly loadingCatalog = signal(false);
  readonly catalogError = signal(false);
  private catalogRequestId = 0;
  readonly cart = signal<readonly CartItem[]>([]);
  readonly paymentLines = signal<readonly PaymentDraftLine[]>([]);
  readonly payment = computed(() => this.paymentLines()[0]?.methodCode ?? '');
  readonly showPaymentErrors = signal(false);
  readonly quickMethods = computed(() => {
    const methods = this.paymentMethods();
    const picked = QUICK_METHODS.map((code) => methods.find((method) => method.code === code)).filter((method) => !!method);
    return picked.length ? picked : methods;
  });
  readonly selectedMethod = computed(() => this.paymentMethods().find((method) => method.code === this.payment()) ?? null);
  readonly kindOf = (code: string): PaymentKind => this.paymentMethods().find((method) => method.code === code)?.kind ?? 'DIGITAL';
  private readonly methodName = (code: string): string => this.paymentMethods().find((method) => method.code === code)?.name ?? code;
  readonly saving = signal(false);
  private pendingSale: PendingSale | null = null;
  private readonly posSettings = signal<PosSettings>({ autoEmailReceipt: false, emailConfigured: false });
  private readonly wholesaleApi = inject(WholesalePriceApiService);
  readonly wholesaleEnabled = computed(() => this.access.hasFeature(PLAN_FEATURES.wholesale));
  readonly offers = signal<readonly WholesalePrice[]>([]);

  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly selectedStoreId = signal<string | null>(null);
  private readonly storeContext = inject(StoreContextService);
  readonly storeLocked = computed(() => !!this.storeContext.selectedStoreId());
  readonly currentStoreName = computed(() => this.stores().find((item) => item.id === this.selectedStoreId())?.name ?? '');
  private readonly followTopStore = effect(() => {
    const top = this.storeContext.selectedStoreId();
    const loaded = this.stores().length > 0;
    untracked(() => {
      if (this.isAdmin && loaded && top && top !== this.selectedStoreId()) this.changeStore(top);
    });
  });

  private readonly scanInput = viewChild<ElementRef<HTMLInputElement>>('query');
  readonly lastAdded = signal<string | null>(null);
  readonly cartUnits = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  readonly canEditCustomer = this.access.canAccess({ permissions: [APP_PERMISSIONS.customersManage] });
  readonly canEditWholesale = this.access.canAccess({ permissions: [APP_PERMISSIONS.wholesaleManage] });
  readonly canEditPrice = this.access.canAccess({ permissions: [APP_PERMISSIONS.salesPriceEdit] });
  private scanBuffer = '';
  private scanLastKey = 0;
  private scanFastKeys = 0;
  private scanTimer: ReturnType<typeof setTimeout> | undefined;
  private lastAddedTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly cleanup = inject(DestroyRef).onDestroy(() => {
    clearTimeout(this.scanTimer);
    clearTimeout(this.lastAddedTimer);
  });

  private attendanceCache: { storeId: string | null; status: AttendanceStatus; at: number } | null = null;

  private prefetchAttendance(): void {
    if (!this.usesAttendance) return;
    const storeId = this.saleStoreId();
    if (this.isAdmin && !storeId) return;
    this.attendanceApi.status(storeId).subscribe({
      next: (status) => (this.attendanceCache = { storeId, status, at: Date.now() }),
      error: () => (this.attendanceCache = null),
    });
  }

  private freshAttendance(): AttendanceStatus | null {
    const cache = this.attendanceCache;
    if (!cache || cache.storeId !== this.saleStoreId() || Date.now() - cache.at > ATTENDANCE_FRESH_MS) return null;
    return cache.status.enabled && !cache.status.present.length ? null : cache.status;
  }

  private readonly cashApi = inject(CashSessionApiService);
  readonly canUseCash = canUseCash();
  private readonly cashStatuses = signal<readonly StoreCashStatus[]>([]);
  changeStore(storeId: string): void {
    if (storeId === this.selectedStoreId()) return;
    this.selectedStoreId.set(storeId);
    if (this.cart().length) {
      this.cart.set([]);
      this.notifications.show('Se vació el carrito: cada local vende solo sus productos.', 'info');
    }
    this.loadCatalog();
  }

  readonly closedCash = computed(() => {
    const statuses = this.cashStatuses();
    const status = this.isAdmin ? statuses.find((s) => s.storeId === this.selectedStoreId()) : statuses[0];
    return status && !status.current ? status : null;
  });

  readonly customerResults = signal<readonly Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);

  readonly canInvoice = computed(() => this.access.hasFeature(INVOICE_FEATURE));
  readonly invoiceCustomer = computed(() => {
    const customer = this.selectedCustomer();
    return this.canInvoice() && customer?.documentType === 'RUC' && customer.documentNumber ? customer : null;
  });

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + this.lineTotal(item), 0),
  );

  lineTotal(item: CartItem): number {
    return item.wholesalePrice != null
      ? wholesaleTotal(item.quantity, item.wholesalePrice)
      : wholesaleTotal(item.quantity, this.retailPrice(item));
  }

  retailPrice(item: CartItem): number {
    return item.unitPrice ?? item.product.salePrice;
  }

  setUnitPrice(id: string, input: HTMLInputElement): void {
    if (!this.canEditPrice) return;
    const value = Number(input.value);
    const item = this.cart().find((candidate) => candidate.product.id === id);
    if (!item) return;
    if (!Number.isFinite(value) || value < 0 || input.value.trim() === '') {
      input.value = String(this.retailPrice(item));
      this.notifications.show('Ingresa un precio válido.', 'warning');
      return;
    }
    const price = Math.round(value * 100) / 100;
    const unitPrice = Math.abs(price - item.product.salePrice) < 0.005 ? null : price;
    this.cart.update((items) => items.map((candidate) => (candidate.product.id === id ? { ...candidate, unitPrice } : candidate)));
  }

  offersFor(productId: string): readonly WholesalePrice[] {
    return this.offers().filter((offer) => offer.productId === productId);
  }

  isCurrentOffer(item: CartItem, offer: WholesalePrice): boolean {
    if (item.wholesalePrice == null || Math.abs(offer.price - item.wholesalePrice) >= 0.005) return false;
    return this.canEditWholesale || Math.abs(offer.quantity - item.quantity) < 0.0005;
  }

  canChooseWholesale(item: CartItem): boolean {
    return this.canEditWholesale || this.offersFor(item.product.id).length > 0;
  }

  quantityLocked(item: CartItem): boolean {
    return item.wholesalePrice != null && !this.canEditWholesale;
  }

  loadOffers(): void {
    if (!this.wholesaleEnabled()) return;
    this.wholesaleApi.list().subscribe({ next: (offers) => this.offers.set(offers), error: () => undefined });
  }

  setMode(id: string, wholesale: boolean): void {
    this.cart.update((items) =>
      items.map((item) => {
        if (item.product.id !== id) return item;
        if (!wholesale) return { ...item, wholesalePrice: null };
        if (!this.canEditWholesale && !this.offersFor(id).length) return item;
        const offer = this.offersFor(id).find((candidate) => candidate.quantity <= item.product.totalStock);
        return offer
          ? { ...item, quantity: offer.quantity, wholesalePrice: offer.price }
          : this.canEditWholesale
            ? { ...item, wholesalePrice: item.product.salePrice }
            : item;
      }),
    );
  }

  applyOffer(id: string, offer: WholesalePrice): void {
    const item = this.cart().find((candidate) => candidate.product.id === id);
    if (item && offer.quantity > item.product.totalStock) {
      this.notifications.show(`Solo hay ${item.product.totalStock} u. en stock para esta oferta.`, 'warning');
      return;
    }
    this.cart.update((items) =>
      items.map((candidate) =>
        candidate.product.id === id ? { ...candidate, quantity: offer.quantity, wholesalePrice: offer.price } : candidate,
      ),
    );
  }

  setWholesaleQuantity(id: string, input: HTMLInputElement): void {
    if (!this.canEditWholesale) return;
    const value = Number(input.value);
    const item = this.cart().find((candidate) => candidate.product.id === id);
    if (!item) return;
    if (!Number.isFinite(value) || value <= 0) {
      input.value = String(item.quantity);
      return;
    }
    const quantity = Math.min(Math.round(value * 1000) / 1000, item.product.totalStock);
    if (quantity !== value) {
      input.value = String(quantity);
      this.notifications.show(`Solo hay ${item.product.totalStock} u. en stock.`, 'warning');
    }
    this.cart.update((items) => items.map((candidate) => (candidate.product.id === id ? { ...candidate, quantity } : candidate)));
  }

  setWholesalePrice(id: string, input: HTMLInputElement): void {
    if (!this.canEditWholesale) return;
    const value = Number(input.value);
    const item = this.cart().find((candidate) => candidate.product.id === id);
    if (!item) return;
    if (!Number.isFinite(value) || value <= 0) {
      input.value = String(item.wholesalePrice ?? '');
      this.notifications.show('El precio por mayor debe ser mayor a cero.', 'warning');
      return;
    }
    const price = Math.round(value * 100) / 100;
    this.cart.update((items) => items.map((candidate) => (candidate.product.id === id ? { ...candidate, wholesalePrice: price } : candidate)));
  }

  deleteOffer(offer: WholesalePrice): void {
    if (!this.canEditWholesale) return;
    this.wholesaleApi.remove(offer.id).subscribe({
      next: () => {
        this.offers.update((offers) => offers.filter((candidate) => candidate.id !== offer.id));
        this.notifications.show('Oferta por mayor eliminada del producto.', 'success');
      },
      error: () => this.notifications.show('No se pudo eliminar la oferta por mayor.', 'error'),
    });
  }

  private saveNewOffers(items: readonly CartItem[]): void {
    if (!this.canEditWholesale) return;
    const fresh = items.filter(
      (item) =>
        item.wholesalePrice != null &&
        !this.offersFor(item.product.id).some((offer) => Math.abs(offer.price - item.wholesalePrice!) < 0.005),
    );
    for (const item of fresh) {
      this.wholesaleApi.add({ productId: item.product.id, quantity: item.quantity, price: item.wholesalePrice! }).subscribe({
        next: (offer) => this.offers.update((offers) => (offers.some((candidate) => candidate.id === offer.id) ? offers : [...offers, offer])),
        error: () => undefined,
      });
    }
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.posApi.settings().subscribe({
      next: (settings) => this.posSettings.set(settings),
      error: () => undefined,
    });
    this.loadOffers();
    const clientId = this.route.snapshot.queryParamMap.get('clientId');
    if (clientId) {
      this.customerApi.get(clientId).subscribe({
        next: (detail) => this.selectCustomer(toCustomer(detail)),
        error: () => this.notifications.show('No se pudo cargar el cliente seleccionado.', 'error'),
      });
    }
    if (this.canUseCash) {
      this.cashApi.status().subscribe({ next: (statuses) => this.cashStatuses.set(statuses), error: () => undefined });
    }
    if (this.isAdmin) {
      const preferred = this.storeContext.selectedStoreId();
      if (preferred) {
        this.selectedStoreId.set(preferred);
        this.loadCatalog();
      }
      this.storeApi.list().subscribe((response) => {
        this.stores.set(response.items.filter((item) => !item.isWaste));
        const initial = this.stores().find((item) => item.id === preferred) ?? this.stores()[0];
        if (initial?.id === this.selectedStoreId() && preferred) return;
        this.selectedStoreId.set(initial?.id ?? null);
        this.loadCatalog();
      });
    } else {
      this.loadCatalog();
    }
    this.focusScan();
  }

  loadPaymentMethods(): void {
    this.paymentMethodsError.set(false);
    this.posApi.paymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods.set(methods);
        if (!this.quickMethods().some((method) => method.code === this.payment())) this.selectPayment(this.quickMethods()[0]?.code ?? '');
      },
      error: () => this.paymentMethodsError.set(true),
    });
  }

  selectPayment(code: string): void {
    this.paymentLines.set(code ? [newPaymentLine(code)] : []);
    this.showPaymentErrors.set(false);
  }

  loadCatalog(silent = false): void {
    const requestId = ++this.catalogRequestId;
    const storeId = this.isAdmin ? this.selectedStoreId() : (this.userContext.user()?.branchId ?? null);
    if (!silent) this.catalogError.set(false);
    if (this.isAdmin && !storeId) {
      this.catalog.set([]);
      return;
    }
    if (!silent) {
      this.loadingCatalog.set(true);
      this.prefetchAttendance();
    }
    const collected: Product[] = [];
    const loadPage = (pageNumber: number): void => {
      this.productApi.list({ pageNumber, pageSize: 100, isActive: true, storeId }).subscribe({
        next: (page) => {
          if (requestId !== this.catalogRequestId) return;
          collected.push(...page.items);
          if (page.items.length === 100 && collected.length < page.totalCount && pageNumber < 50) {
            loadPage(pageNumber + 1);
            return;
          }
          this.catalog.set(
            collected.filter((product) => product.totalStock > 0).sort((x, y) => x.name.localeCompare(y.name, 'es')),
          );
          this.loadingCatalog.set(false);
        },
        error: () => {
          if (requestId !== this.catalogRequestId) return;
          this.loadingCatalog.set(false);
          if (silent) return;
          this.catalogError.set(true);
          this.notifications.show('No se pudieron cargar los productos del local.', 'error');
        },
      });
    };
    loadPage(1);
  }

  productLabel(product: Product): string {
    return `${product.name} (${product.sku}) · stock ${product.totalStock} · ${formatMoney(product.salePrice)}`;
  }

  pickProduct(select: HTMLSelectElement): void {
    const product = this.catalog().find((item) => item.id === select.value);
    select.value = '';
    if (product) this.add(product);
    this.focusScan();
  }

  addByCode(input: HTMLInputElement): void {
    clearTimeout(this.scanTimer);
    const raw = input.value.trim();
    if (!raw) return;
    if (!this.addByTerm(raw)) {
      input.select();
      return;
    }
    input.value = '';
    input.focus();
  }

  onScanKey(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addByCode(input);
      this.scanFastKeys = 0;
      return;
    }
    if (event.key.length !== 1) return;
    const now = performance.now();
    this.scanFastKeys = now - this.scanLastKey < SCAN_KEY_GAP_MS ? this.scanFastKeys + 1 : 0;
    this.scanLastKey = now;
  }

  onScanInput(input: HTMLInputElement): void {
    clearTimeout(this.scanTimer);
    if (this.scanFastKeys < SCAN_MIN_LENGTH - 1) return;
    this.scanTimer = setTimeout(() => {
      const raw = input.value.trim();
      if (raw.length >= SCAN_MIN_LENGTH && this.findByCode(raw) && this.addByTerm(raw)) {
        input.value = '';
        this.scanFastKeys = 0;
      }
    }, SCAN_IDLE_MS);
  }

  onGlobalKey(event: KeyboardEvent): void {
    if (this.dialog.openDialogs.length || isEditable(event.target)) return;
    const now = performance.now();
    if (event.key === 'Enter') {
      const code = this.scanBuffer;
      this.scanBuffer = '';
      if (code.length >= SCAN_MIN_LENGTH) {
        event.preventDefault();
        this.addByTerm(code);
        this.focusScan();
      }
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return;
    this.scanBuffer = now - this.scanLastKey < SCAN_KEY_GAP_MS ? this.scanBuffer + event.key : event.key;
    this.scanLastKey = now;
  }

  private findByCode(raw: string): Product | undefined {
    const term = raw.toLowerCase();
    return this.catalog().find((item) => item.barcode?.toLowerCase() === term || item.sku.toLowerCase() === term);
  }

  private addByTerm(raw: string): boolean {
    const term = raw.toLowerCase();
    const product = this.findByCode(raw) ?? this.catalog().find((item) => item.name.toLowerCase() === term);
    if (!product) {
      this.notifications.show(
        this.loadingCatalog()
          ? 'Todavía se están cargando los productos del local. Intenta en un momento.'
          : `No hay un producto con código “${raw}” con stock en este local. Elígelo de la lista de productos.`,
        'warning',
      );
      return false;
    }
    this.add(product);
    return true;
  }

  focusScan(): void {
    setTimeout(() => this.scanInput()?.nativeElement.focus());
  }

  editCustomer(customer: Customer): void {
    this.dialog
      .open<CustomerEditDialog, CustomerEditDialogData, Customer>(CustomerEditDialog, { data: { customerId: customer.id } })
      .afterClosed()
      .pipe(filter((updated): updated is Customer => !!updated))
      .subscribe((updated) => {
        this.selectedCustomer.set(updated);
        this.notifications.show('Cliente actualizado.', 'success');
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
    const current = this.cart().find((item) => item.product.id === product.id);
    if (current && this.quantityLocked(current)) {
      this.notifications.show('Este producto está con precio por mayor: elige otra oferta o cámbialo a "Por menor".', 'info');
      return;
    }
    this.cart.update((items) => {
      const found = items.find((item) => item.product.id === product.id);
      return found
        ? items.map((item) =>
            item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.totalStock) } : item,
          )
        : [...items, { product, quantity: 1 }];
    });
    this.lastAdded.set(product.id);
    clearTimeout(this.lastAddedTimer);
    this.lastAddedTimer = setTimeout(() => this.lastAdded.set(null), 900);
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

  confirm(): void {
    if (!this.cart().length) {
      this.notifications.show('Agrega al menos un producto.', 'warning');
      return;
    }
    if (!this.paymentMethods().length) {
      this.notifications.show('Tu empresa no tiene métodos de pago habilitados.', 'error');
      return;
    }
    const invoiceCustomer = this.invoiceCustomer();
    if (invoiceCustomer && !isValidRuc(invoiceCustomer.documentNumber ?? '')) {
      this.notifications.show('El RUC del cliente no es válido. Corrígelo en Clientes o elige otro cliente.', 'warning');
      return;
    }
    const total = this.subtotal();
    const error = paymentsError(this.paymentLines(), this.kindOf, total);
    if (error) {
      this.showPaymentErrors.set(true);
      this.notifications.show(error, 'warning');
      return;
    }
    if (!this.usesAttendance) {
      this.openConfirm(total, null);
      return;
    }
    const cached = this.freshAttendance();
    if (cached) {
      this.openConfirm(total, cached);
      this.prefetchAttendance();
      return;
    }
    this.saving.set(true);
    this.attendanceApi.status(this.saleStoreId()).subscribe({
      next: (status) => {
        this.saving.set(false);
        this.attendanceCache = { storeId: this.saleStoreId(), status, at: Date.now() };
        if (status.enabled && !status.present.length) this.askAttendance(status, total);
        else this.openConfirm(total, status);
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(attendanceErrorMessage(cause, 'No se pudo verificar quién está en turno.'), 'error');
      },
    });
  }

  private saleStoreId(): string | null {
    return this.isAdmin ? this.selectedStoreId() : (this.userContext.user()?.branchId ?? null);
  }

  private askAttendance(status: AttendanceStatus, total: number): void {
    this.dialog
      .open<AttendanceMarkDialog, AttendanceMarkDialogData, boolean>(AttendanceMarkDialog, {
        data: {
          storeId: status.storeId,
          storeName: status.storeName,
          present: [],
          message: 'Para registrar la venta alguien debe estar en turno. Marca tu entrada con tu usuario.',
        },
      })
      .afterClosed()
      .pipe(filter((marked): marked is true => marked === true))
      .subscribe(() => this.attendanceApi.status(status.storeId).subscribe({
        next: (fresh) => this.openConfirm(total, fresh),
        error: (cause: unknown) => this.notifications.show(attendanceErrorMessage(cause, 'No se pudo verificar quién está en turno.'), 'error'),
      }));
  }

  private openConfirm(total: number, status: AttendanceStatus | null): void {
    const user = this.userContext.user();
    const present = status?.present ?? [];
    const seller: SaleConfirmSeller = {
      attendanceEnabled: !!status?.enabled,
      present,
      defaultProfileId: present.some((person) => person.profileId === status?.currentProfileId) ? status!.currentProfileId : (present[0]?.profileId ?? null),
      loggedUserName: user?.displayName ?? 'Usuario actual',
      loggedUserRole: user?.role ?? '',
    };
    const customer = this.selectedCustomer();
    this.dialog
      .open<SaleConfirmDialog, SaleConfirmData, SaleConfirmResult | false>(SaleConfirmDialog, {
        data: {
          customer: this.invoiceCustomer()
            ? `Factura para ${customer!.displayName} (RUC ${customer!.documentNumber})`
            : customer
              ? `${customer.displayName}${customer.documentNumber ? ` (${customer.documentType ?? 'Doc.'} ${customer.documentNumber})` : ''}`
              : 'Cliente general',
          lines: this.cart().map((item) =>
            item.wholesalePrice != null
              ? {
                  name: `${item.product.name} (por mayor)`,
                  quantity: item.quantity,
                  unitPrice: item.wholesalePrice,
                  total: wholesaleTotal(item.quantity, item.wholesalePrice),
                }
              : { name: item.product.name, quantity: item.quantity, unitPrice: this.retailPrice(item), total: this.lineTotal(item) },
          ),
          discount: 0,
          paymentMethod: this.paymentLines().map((line) => this.methodName(line.methodCode)).join(' + '),
          paymentDetails: this.previewPayments(total),
          seller,
        },
      })
      .afterClosed()
      .pipe(filter((result): result is SaleConfirmResult => !!result))
      .subscribe((result) => this.register(result.sellerProfileId));
  }

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

  private applySoldStock(items: readonly CartItem[]): void {
    const sold = new Map(items.map((item) => [item.product.id, item.quantity]));
    this.catalog.update((products) =>
      products
        .map((product) => (sold.has(product.id) ? { ...product, totalStock: product.totalStock - sold.get(product.id)! } : product))
        .filter((product) => product.totalStock > 0),
    );
  }

  private autoEmailReceipt(sale: SaleDetail): string | null {
    const settings = this.posSettings();
    const email = sale.clientEmail?.trim();
    if (!settings.autoEmailReceipt || !email) return null;
    if (!settings.emailConfigured) {
      this.notifications.show('El envío automático está activo, pero el servidor no tiene correo configurado.', 'warning');
      return null;
    }
    this.receiptMailer.sendTo(sale, email);
    return email;
  }

  private register(sellerProfileId: string | null): void {
    const total = this.subtotal();
    const payments = toPaymentLines(this.paymentLines(), this.kindOf, total);
    if (!payments.length) return;
    const invoiceCustomer = this.invoiceCustomer();
    const body: PosSaleRequest = {
      storeId: this.isAdmin ? this.selectedStoreId() : null,
      sellerProfileId,
      clientId: this.selectedCustomer()?.id ?? null,
      paymentMethod: payments[0].method,
      discountTotal: 0,
      notes: null,
      lines: this.cart().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discountAmount: 0,
        wholesalePrice: item.wholesalePrice ?? null,
        unitPrice: item.wholesalePrice == null ? (item.unitPrice ?? null) : null,
      })),
      payments,
      invoice: invoiceCustomer
        ? { ruc: invoiceCustomer.documentNumber!, legalName: invoiceCustomer.displayName, address: null }
        : null,
      expectedTotal: Math.round(total * 100) / 100,
    };
    const pending = pendingSaleFor(this.pendingSale, body, () => crypto.randomUUID());
    this.pendingSale = pending;
    this.saving.set(true);
    this.posApi
      .confirm(body, pending.key)
      .pipe(timeout(SALE_CONFIRM_TIMEOUT_MS))
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.pendingSale = null;
          if (this.wholesaleEnabled()) this.saveNewOffers(this.cart());
          this.applySoldStock(this.cart());
          this.loadCatalog(true);
          this.prefetchAttendance();
          this.sound.play('sale');
          const autoEmailedTo = this.autoEmailReceipt(sale);
          this.dialog
            .open(SaleSuccessDialog, {
              data: {
                saleNumber: isInvoice(sale) ? `Factura ${documentNumber(sale)}` : sale.saleNumber,
                customer: sale.customerLegalName ?? sale.clientName ?? 'Cliente general',
                paymentMethod: sale.paymentMethod,
                total: sale.total,
                change: sale.changeAmount ?? breakdown(this.paymentLines(), this.kindOf, total).change,
                paymentDetails: (sale.payments ?? []).map((payment) => paymentSummary(payment)),
                clientEmail: sale.clientEmail ?? null,
                autoEmailedTo,
              },
            })
            .afterClosed()
            .subscribe((action) => {
              this.cart.set([]);
              this.selectedCustomer.set(null);
              this.selectPayment(this.quickMethods()[0]?.code ?? '');
              this.focusScan();
              if (action === 'print') void this.router.navigate(['/app/sales', sale.id, 'comprobante']);
              else if (action === 'detail') void this.router.navigate(['/app/sales', sale.id]);
              else if (action === 'email') this.receiptMailer.send(sale);
            });
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          if (isUncertainSaleFailure(cause)) {
            this.notifications.show(
              'No se pudo confirmar si la venta se registró. Vuelve a confirmar: la venta no se duplicará.',
              'warning',
            );
            return;
          }
          this.pendingSale = null;
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

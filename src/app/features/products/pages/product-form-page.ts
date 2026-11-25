import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, filter, of, switchMap } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { DiffField, buildDiffRows, formatAmount } from '../../../shared/utils/diff-rows';
import { MARGIN_STATUS_LABEL, marginStatus } from '../../../shared/utils/margin-status';
import { BrandApiService } from '../../brands/data-access/brand-api.service';
import { CategoryApiService } from '../../categories/data-access/category-api.service';
import { withParentLabel } from '../../categories/utils/category-label';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { Store } from '../../locales/models/local.model';
import { PriceChangeData, PriceChangeDialog } from '../components/price-change-dialog/price-change-dialog';
import { ProductApiService } from '../data-access/product-api.service';
import { UnitApiService, UnitOption } from '../data-access/unit-api.service';
import { ProductDetail, ProductStoreStock } from '../models/product.model';
import { RegionalPipe } from '../../../shared/pipes/date-time.pipe';
import { ProductWholesaleOffers } from '../components/product-wholesale-offers/product-wholesale-offers';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, RegionalPipe, ProductWholesaleOffers],
  templateUrl: './product-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './product-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly brandApi = inject(BrandApiService);
  private readonly unitApi = inject(UnitApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly isEdit = !!this.id;
  readonly productId = this.id;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);

  readonly categories = signal<readonly { id: string; name: string }[]>([]);
  readonly brands = signal<readonly { id: string; name: string }[]>([]);
  readonly units = signal<readonly UnitOption[]>([]);
  readonly stores = signal<readonly Store[]>([]);
  private readonly initialStoreTick = signal(0);
  readonly showStockEditor = this.isEdit && !inject(AccessControlService).hasFeature('GOODS_RECEIPTS');
  readonly savingStock = signal(false);
  readonly totalStock = signal<number | null>(null);
  readonly mainStore = computed<Store | null>(() =>
    [...this.stores()].filter((store) => store.isActive).sort((a, b) => a.code.localeCompare(b.code))[0] ?? null,
  );
  private readonly storeContext = inject(StoreContextService);
  readonly topStore = computed(() => this.storeContext.selectedStore());
  readonly activeStores = computed(() => this.stores().filter((store) => store.isActive));
  private readonly storeStocks = signal<readonly ProductStoreStock[]>([]);
  readonly stockStoreId = signal<string | null>(null);
  readonly stockStoreName = computed(() => this.stores().find((store) => store.id === this.stockStoreId())?.name ?? null);
  readonly stockStoreCurrent = computed(() =>
    this.storeStocks().find((row) => row.storeId === this.stockStoreId())?.currentStock ?? 0);

  readonly stockForm = new FormGroup({
    storeId: new FormControl<string | null>(null, { nonNullable: false, validators: [Validators.required] }),
    stock: new FormControl<number | null>(null, { nonNullable: false, validators: [Validators.required, Validators.min(0)] }),
    minStock: new FormControl<number | null>(null, { nonNullable: false, validators: [Validators.min(0)] }),
  });

  private existing: ProductDetail | null = null;

  constructor() {
    effect(() => {
      const top = this.storeContext.selectedStoreId();
      const fallback = this.mainStore()?.id ?? null;
      this.storeStocks();
      untracked(() => {
        const control = this.stockForm.controls.storeId;
        if (top) {
          control.setValue(top);
          control.disable({ emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
          if (!control.value || !this.stores().some((store) => store.id === control.value)) control.setValue(fallback);
        }
        if (!this.isEdit) {
          const initial = this.form.controls.initialStoreId;
          if (top) {
            initial.setValue(top);
            initial.disable({ emitEvent: false });
          } else {
            initial.enable({ emitEvent: false });
            if (!initial.value || !this.stores().some((store) => store.id === initial.value)) initial.setValue(fallback);
          }
        }
      });
    });
    this.stockForm.controls.storeId.valueChanges.subscribe((storeId) => this.fillStock(storeId));
    this.form.controls.initialStoreId.valueChanges.subscribe(() => this.initialStoreTick.update((n) => n + 1));
  }

  private fillStock(storeId: string | null): void {
    this.stockStoreId.set(storeId);
    const row = this.storeStocks().find((item) => item.storeId === storeId);
    this.stockForm.patchValue({ stock: row?.currentStock ?? 0, minStock: row?.minStock ?? 0 }, { emitEvent: false });
  }
  private initialValue: ProductFormValue | null = null;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(220)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
    sku: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    barcode: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(64)] }),
    categoryId: new FormControl<string | null>(null, { nonNullable: false }),
    brandId: new FormControl<string | null>(null, { nonNullable: false }),
    unitId: new FormControl<string | null>(null, { nonNullable: false }),
    referenceCost: new FormControl<number | null>(null, { nonNullable: false, validators: [Validators.min(0)] }),
    salePrice: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    priceChangeReason: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    active: new FormControl(true, { nonNullable: true }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    initialStoreId: new FormControl<string | null>(null, { nonNullable: false }),
    initialStock: new FormControl<number | null>(0, { nonNullable: false, validators: [Validators.min(0)] }),
    minStock: new FormControl<number | null>(0, { nonNullable: false, validators: [Validators.min(0)] }),
  });

  readonly initialStoreName = computed(() => {
    this.initialStoreTick();
    const id = this.form.controls.initialStoreId.getRawValue();
    return this.stores().find((store) => store.id === id)?.name ?? null;
  });
  readonly otherStoresCount = computed(() => {
    this.initialStoreTick();
    const id = this.form.controls.initialStoreId.getRawValue();
    return this.activeStores().filter((store) => store.id !== id).length;
  });

  get marginPercent(): number {
    const cost = this.form.controls.referenceCost.value ?? 0;
    const sell = this.form.controls.salePrice.value;
    return sell > 0 ? Math.round(((sell - cost) / sell) * 1000) / 10 : 0;
  }

  get marginLabel(): string {
    return MARGIN_STATUS_LABEL[marginStatus(this.marginPercent)];
  }

  ngOnInit(): void {
    this.categoryApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.categories.set(withParentLabel(page.items)));
    this.brandApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.brands.set(page.items));
    this.unitApi.list().subscribe((page) => this.units.set(page.items));
    if (!this.isEdit || this.showStockEditor) {
      this.storeApi.list().subscribe((result) => {
        const items = result.items.filter((item) => !item.isWaste);
        this.stores.set(items);
      });
    }

    if (this.id) {
      this.api.get(this.id).subscribe({
        next: (product) => {
          this.existing = product;
          this.totalStock.set(product.totalStock);
          this.storeStocks.set(product.stores ?? []);
          this.fillStock(this.stockForm.getRawValue().storeId);
          this.form.patchValue({
            name: product.name,
            description: product.description ?? '',
            sku: product.sku,
            barcode: product.barcode ?? '',
            categoryId: product.categoryId,
            brandId: product.brandId,
            unitId: product.unitId,
            referenceCost: product.referenceCost,
            salePrice: product.salePrice,
            active: product.isActive,
            imageUrl: product.imageUrl ?? '',
          });
          this.initialValue = this.form.getRawValue();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notifications.show('No se pudo cargar el producto.', 'error');
        },
      });
    }
  }

  saveStock(): void {
    if (!this.existing || this.savingStock()) return;
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }
    const value = this.stockForm.getRawValue();
    this.savingStock.set(true);
    this.api
      .setStock(this.existing.id, { storeId: value.storeId!, stock: value.stock ?? 0, minStock: value.minStock })
      .subscribe({
        next: (result) => {
          this.savingStock.set(false);
          this.totalStock.update((total) => (total ?? 0) + result.stockAfter - result.stockBefore);
          this.storeStocks.update((rows) => {
            const others = rows.filter((row) => row.storeId !== value.storeId);
            return [...others, { storeId: value.storeId!, storeName: this.stockStoreName() ?? '', currentStock: result.stockAfter, minStock: value.minStock ?? 0 }];
          });
          this.notifications.show(`Stock guardado: ${result.stockBefore} → ${result.stockAfter} en el local.`, 'success');
        },
        error: (cause: unknown) => {
          this.savingStock.set(false);
          this.notifications.show(this.stockMessage(cause), 'error');
        },
      });
  }

  private stockMessage(cause: unknown): string {
    if (cause instanceof AppHttpError && (cause.status === 400 || cause.status === 409)) {
      const body = (cause.originalError as { error?: { title?: unknown } } | undefined)?.error;
      if (typeof body?.title === 'string') return body.title;
    }
    if (cause instanceof AppHttpError && cause.status === 403) return 'No tienes permiso para gestionar productos.';
    return 'No se pudo guardar el stock.';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.existing || !this.initialValue) {
      this.persist(this.form.getRawValue());
      return;
    }
    const initial = this.initialValue;
    this.askPriceReason(this.existing, initial)
      .pipe(
        filter((ok) => ok),
        switchMap(() => {
          const value = this.form.getRawValue();
          return this.dialog
            .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, { data: this.changesReview(initial, value) })
            .afterClosed()
            .pipe(filter(Boolean), switchMap(() => of(value)));
        }),
      )
      .subscribe((value) => this.persist(value));
  }

  private askPriceReason(product: ProductDetail, initial: ProductFormValue): Observable<boolean> {
    const newPrice = this.form.controls.salePrice.value;
    if (newPrice === initial.salePrice || this.form.controls.priceChangeReason.value.trim()) return of(true);
    return this.dialog
      .open<PriceChangeDialog, PriceChangeData, string>(PriceChangeDialog, {
        data: { productName: product.name, sku: product.sku, previousPrice: initial.salePrice, newPrice },
      })
      .afterClosed()
      .pipe(
        switchMap((reason) => {
          if (!reason) return of(false);
          this.form.controls.priceChangeReason.setValue(reason);
          return of(true);
        }),
      );
  }

  private changesReview(initial: ProductFormValue, value: ProductFormValue): ReviewDialogData {
    const nameOf = (list: readonly { id: string; name: string }[]) => (id: unknown) =>
      list.find((item) => item.id === id)?.name ?? '—';
    const fields: readonly DiffField<ProductFormValue>[] = [
      { key: 'name', label: 'Nombre' },
      { key: 'sku', label: 'SKU' },
      { key: 'barcode', label: 'Código de barras' },
      { key: 'description', label: 'Descripción' },
      { key: 'categoryId', label: 'Categoría', format: nameOf(this.categories()) },
      { key: 'brandId', label: 'Marca', format: nameOf(this.brands()) },
      { key: 'unitId', label: 'Unidad', format: (id) => this.units().find((unit) => unit.id === id)?.name ?? '—' },
      { key: 'referenceCost', label: 'Costo de referencia', format: formatAmount },
      { key: 'salePrice', label: 'Precio', format: formatAmount },
      { key: 'active', label: 'Estado', format: (active) => (active ? 'Activo' : 'Inactivo') },
      { key: 'imageUrl', label: 'Imagen' },
    ];
    return {
      title: 'Resumen de cambios',
      code: 'MOD-AD-14',
      icon: 'difference',
      meta: [{ label: value.name.trim(), value: `SKU: ${value.sku.trim() || '—'}` }],
      diff: { rows: buildDiffRows(initial, value, fields) },
      banner: {
        tone: 'info',
        text: 'Estos cambios se registrarán automáticamente en el historial de auditoría de este producto.',
      },
      confirmLabel: 'Confirmar cambios',
    };
  }

  private initialStock(value: ProductFormValue): InitialStock {
    const stock = value.initialStock ?? 0;
    const min = value.minStock ?? 0;
    if (!value.initialStoreId || (stock <= 0 && min <= 0)) return { initialStoreId: null, initialStock: null, minStock: null };
    return { initialStoreId: value.initialStoreId, initialStock: stock, minStock: min };
  }

  private persist(value: ProductFormValue): void {
    this.saving.set(true);

    const request = this.existing
      ? this.api.update(this.existing.id, {
          name: value.name.trim(),
          sku: value.sku.trim(),
          barcode: value.barcode.trim() || null,
          description: value.description.trim() || null,
          categoryId: value.categoryId,
          brandId: value.brandId,
          unitId: value.unitId,
          salePrice: value.salePrice,
          referenceCost: value.referenceCost,
          imageUrl: value.imageUrl.trim() || null,
          isActive: value.active,
          priceChangeReason: value.priceChangeReason.trim() || undefined,
          version: this.existing.version,
        })
      : this.api.create({
          name: value.name.trim(),
          sku: value.sku.trim() || undefined,
          barcode: value.barcode.trim() || null,
          description: value.description.trim() || null,
          categoryId: value.categoryId,
          brandId: value.brandId,
          unitId: value.unitId,
          salePrice: value.salePrice,
          referenceCost: value.referenceCost,
          imageUrl: value.imageUrl.trim() || null,
          isActive: value.active,
          ...this.initialStock(value),
        });

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.show(`Producto ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
        void this.router.navigateByUrl('/app/products');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.messageFor(cause), 'error');
      },
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return cause.message || 'Conflicto: el producto cambió o el SKU/código de barras ya existe.';
      if (cause.status === 403) return 'No tienes permiso para gestionar productos.';
      if (cause.status === 400) return 'Revisa los datos ingresados.';
    }
    return `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} el producto.`;
  }
}

type InitialStock = { initialStoreId: string | null; initialStock: number | null; minStock: number | null };

type ProductFormValue = ReturnType<ProductFormPage['form']['getRawValue']>;

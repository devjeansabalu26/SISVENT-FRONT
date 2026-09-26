import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, filter, of, switchMap } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { DiffField, buildDiffRows, formatSoles } from '../../../shared/utils/diff-rows';
import { MARGIN_STATUS_LABEL, marginStatus } from '../../../shared/utils/margin-status';
import { BrandApiService } from '../../brands/data-access/brand-api.service';
import { CategoryApiService } from '../../categories/data-access/category-api.service';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { Store } from '../../locales/models/local.model';
import { PriceChangeData, PriceChangeDialog } from '../components/price-change-dialog/price-change-dialog';
import { ProductApiService } from '../data-access/product-api.service';
import { UnitApiService, UnitOption } from '../data-access/unit-api.service';
import { ProductDetail } from '../models/product.model';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
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
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);

  readonly categories = signal<readonly { id: string; name: string }[]>([]);
  readonly brands = signal<readonly { id: string; name: string }[]>([]);
  readonly units = signal<readonly UnitOption[]>([]);
  readonly stores = signal<readonly Store[]>([]);

  private existing: ProductDetail | null = null;
  /** Formulario recién precargado en edición: base del "Resumen de cambios" (MOD-AD-14). */
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
    // Solo CREATE: stock inicial opcional (ver Control de Almacén). En EDIT el stock se gestiona desde
    // Inventario / Ingreso de mercadería, no desde este formulario (regla ya existente en el sistema).
    initialStoreId: new FormControl<string | null>(null, { nonNullable: false }),
    initialStock: new FormControl<number | null>(null, { nonNullable: false, validators: [Validators.min(0)] }),
    minStock: new FormControl<number | null>(null, { nonNullable: false, validators: [Validators.min(0)] }),
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
    this.categoryApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.categories.set(page.items));
    this.brandApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.brands.set(page.items));
    this.unitApi.list().subscribe((page) => this.units.set(page.items));
    if (!this.isEdit) {
      this.storeApi.list().subscribe((result) => {
        this.stores.set(result.items);
        // Con un único local (caso típico al recién crear la empresa) lo preseleccionamos.
        if (result.items.length === 1) this.form.controls.initialStoreId.setValue(result.items[0].id);
      });
    }

    if (this.id) {
      this.api.get(this.id).subscribe({
        next: (product) => {
          this.existing = product;
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

  /**
   * MOD-AD-15: si cambió el precio de venta y no se escribió el motivo en el formulario, lo pide en el
   * modal y lo copia al control `priceChangeReason` (que ya viaja al backend). Emite `false` si se cancela.
   */
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

  /** MOD-AD-14: tabla Campo / Antes / Después con solo lo modificado. */
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
      { key: 'referenceCost', label: 'Costo de referencia', format: formatSoles },
      { key: 'salePrice', label: 'Precio', format: formatSoles },
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
          initialStoreId: value.initialStoreId,
          initialStock: value.initialStoreId ? (value.initialStock ?? 0) : null,
          minStock: value.initialStoreId ? (value.minStock ?? 0) : null,
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

type ProductFormValue = ReturnType<ProductFormPage['form']['getRawValue']>;

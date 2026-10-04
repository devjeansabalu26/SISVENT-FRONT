import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StoreOption } from '../../../../core/context/store-context/store-context.service';
import { cashErrorMessage } from '../../../sales/data-access/cash-session-api.service';
import { ProductApiService } from '../../../products/data-access/product-api.service';
import { Product } from '../../../products/models/product.model';
import { InventoryApiService, StockTransferResult } from '../../data-access/inventory-api.service';

export interface StockTransferData {
  readonly stores: readonly StoreOption[];
  readonly fromStoreId: string | null;
}

function trimmedMinLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && String(control.value).trim().length < min ? { minlength: true } : null;
}

function differentStores(group: AbstractControl): ValidationErrors | null {
  const { fromStoreId, toStoreId } = group.value as { fromStoreId?: string; toStoreId?: string };
  return fromStoreId && toStoreId && fromStoreId === toStoreId ? { sameStore: true } : null;
}

type LineGroup = FormGroup<{ productId: FormControl<string>; quantity: FormControl<number | null> }>;

@Component({
  selector: 'app-stock-transfer-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog transfer" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">local_shipping</span>
        <div>
          <h2>Transferir stock</h2>
          <p>Mueve productos de un local a otro para que puedan venderse allí</p>
        </div>
      </header>

      <div class="fields two">
        <label
          ><span>Local de origen <span class="required">*</span></span>
          <select formControlName="fromStoreId" [class.invalid]="showError('fromStoreId')" (change)="loadProducts()">
            <option value="" disabled>Selecciona el origen</option>
            @for (store of data.stores; track store.id) { <option [value]="store.id">{{ store.name }}</option> }
          </select>
          @if (showError('fromStoreId')) { <small class="hint">Selecciona el local de origen.</small> }
        </label>
        <label
          ><span>Local de destino <span class="required">*</span></span>
          <select formControlName="toStoreId" [class.invalid]="showError('toStoreId') || sameStore()">
            <option value="" disabled>Selecciona el destino</option>
            @for (store of data.stores; track store.id) { <option [value]="store.id">{{ store.name }}</option> }
          </select>
          @if (sameStore()) { <small class="hint">El destino debe ser distinto del origen.</small> }
          @else if (showError('toStoreId')) { <small class="hint">Selecciona el local de destino.</small> }
        </label>
      </div>

      <div class="lines" formArrayName="lines">
        @for (line of lines.controls; track line; let i = $index) {
          <div class="line" [formGroupName]="i">
            <select formControlName="productId" [class.invalid]="lineInvalid(i, 'productId')" aria-label="Producto">
              <option value="" disabled>{{ products().length ? 'Selecciona un producto' : 'El origen no tiene productos' }}</option>
              @for (product of products(); track product.id) {
                <option [value]="product.id">{{ product.name }} ({{ product.sku }}) · disponible {{ product.totalStock }}</option>
              }
            </select>
            <input type="number" min="1" step="1" formControlName="quantity" placeholder="Cantidad" aria-label="Cantidad"
              [class.invalid]="lineInvalid(i, 'quantity')" />
            <button type="button" class="icon" (click)="removeLine(i)" [disabled]="lines.length === 1" aria-label="Quitar producto">
              <span class="material-icons">delete</span>
            </button>
            @if (overAvailable(i); as max) { <small class="hint wide">Solo hay {{ max }} disponibles en el origen.</small> }
          </div>
        }
        <button type="button" class="link" (click)="addLine()">+ Agregar producto</button>
      </div>

      <label class="wide"
        ><span>Motivo <span class="required">*</span></span>
        <textarea formControlName="reason" maxlength="500" placeholder="Escribe el motivo de la transferencia (reposición, apertura de local…)"
          [class.invalid]="showError('reason')"></textarea>
        @if (showError('reason')) { <small class="hint">Describe el motivo (mínimo 5 caracteres).</small> }
      </label>

      @if (error()) { <p class="hint" role="alert">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid || hasOverAvailable() || saving()">
          {{ saving() ? 'Transfiriendo…' : 'Transferir' }}
        </button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .transfer { width: min(680px, calc(100vw - 40px)); }
    .lines { display: grid; gap: 10px; }
    .line { display: grid; grid-template-columns: minmax(0, 1fr) 110px 40px; gap: 8px; align-items: center; }
    .line .wide { grid-column: 1 / -1; }
    .icon { display: grid; place-items: center; height: 40px; border: 1px solid var(--control-border); border-radius: var(--control-radius);
      color: var(--color-danger); background: var(--control-bg); cursor: pointer; }
    .icon:disabled { opacity: 0.4; cursor: not-allowed; }
    .link { justify-self: start; padding: 0; border: 0; color: var(--color-primary); background: none; font: inherit; font-weight: 600; cursor: pointer; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTransferDialog implements OnInit {
  readonly data = inject<StockTransferData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StockTransferDialog, StockTransferResult>);
  private readonly api = inject(InventoryApiService);
  private readonly productApi = inject(ProductApiService);

  readonly products = signal<readonly Product[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup(
    {
      fromStoreId: new FormControl(this.data.fromStoreId ?? '', { nonNullable: true, validators: [Validators.required] }),
      toStoreId: new FormControl(this.data.stores.find((s) => s.id !== this.data.fromStoreId)?.id ?? '', {
        nonNullable: true, validators: [Validators.required],
      }),
      lines: new FormArray<LineGroup>([this.newLine()]),
      reason: new FormControl('', { nonNullable: true, validators: [Validators.required, trimmedMinLength(5), Validators.maxLength(500)] }),
    },
    { validators: differentStores },
  );

  get lines(): FormArray<LineGroup> {
    return this.form.controls.lines;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    const from = this.form.controls.fromStoreId.value;
    this.products.set([]);
    this.lines.controls.forEach((line) => line.controls.productId.setValue(''));
    if (!from) return;
    this.productApi.list({ storeId: from, isActive: true, pageSize: 100 }).subscribe({
      next: (page) => this.products.set(page.items.filter((p) => p.totalStock > 0)),
      error: () => this.error.set('No se pudieron cargar los productos del origen.'),
    });
  }

  addLine(): void {
    this.lines.push(this.newLine());
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) this.lines.removeAt(index);
  }

  showError(name: 'fromStoreId' | 'toStoreId' | 'reason'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  sameStore(): boolean {
    return this.form.hasError('sameStore');
  }

  lineInvalid(index: number, field: 'productId' | 'quantity'): boolean {
    const control = this.lines.at(index).controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  overAvailable(index: number): number | null {
    const { productId, quantity } = this.lines.at(index).getRawValue();
    const product = this.products().find((p) => p.id === productId);
    return product && (quantity ?? 0) > product.totalStock ? product.totalStock : null;
  }

  hasOverAvailable(): boolean {
    return this.lines.controls.some((_, i) => this.overAvailable(i) !== null);
  }

  confirm(): void {
    if (this.form.invalid || this.hasOverAvailable() || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .transfer({
        fromStoreId: value.fromStoreId,
        toStoreId: value.toStoreId,
        reason: value.reason.trim(),
        lines: value.lines.map((line) => ({ productId: line.productId, quantity: line.quantity ?? 0 })),
      })
      .subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(cashErrorMessage(cause, 'No se pudo transferir el stock.'));
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private newLine(): LineGroup {
    return new FormGroup({
      productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      quantity: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { cashErrorMessage } from '../../data-access/cash-session-api.service';
import { CreditNoteApiService, CreditNoteDetail, SaleCreditSummary } from '../../data-access/credit-note-api.service';
import { PosApiService } from '../../data-access/pos-api.service';
import { PaymentMethodOption } from '../../models/payment.model';

function trimmedMinLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && String(control.value).trim().length < min ? { minlength: true } : null;
}

/** Al menos un producto con cantidad mayor a cero. */
function anyQuantity(array: AbstractControl): ValidationErrors | null {
  return (array.value as (number | null)[]).some((qty) => (qty ?? 0) > 0) ? null : { empty: true };
}

/**
 * Nota de crédito total o parcial: cantidades a devolver por producto (máximo lo disponible), método de
 * reembolso y motivo. Se cierra con la nota emitida (o `undefined` si se cancela).
 */
@Component({
  selector: 'app-credit-note-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog credit" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">assignment_return</span>
        <div>
          <h2>Nota de crédito</h2>
          <p>Venta {{ data.saleNumber }} · total S/ {{ data.saleTotal.toFixed(2) }}
            @if (data.creditedTotal > 0) { · ya devuelto S/ {{ data.creditedTotal.toFixed(2) }} }</p>
        </div>
      </header>

      <div class="table-scroll">
        <table>
          <thead><tr><th>Producto</th><th>Vendido</th><th>Devuelto</th><th>P. neto</th><th>A devolver</th><th>Importe</th></tr></thead>
          <tbody formArrayName="quantities">
            @for (line of data.lines; track line.productId; let i = $index) {
              <tr [class.done]="line.available <= 0">
                <td>{{ line.productName }} <small>{{ line.sku }}</small></td>
                <td>{{ line.sold }}</td>
                <td>{{ line.returned }}</td>
                <td>S/ {{ line.unitPrice.toFixed(2) }}</td>
                <td>
                  <input type="number" min="0" [max]="line.available" step="1" [formControlName]="i"
                    [attr.aria-label]="'Cantidad a devolver de ' + line.productName" [class.invalid]="qtyInvalid(i)" />
                  <small class="muted">de {{ line.available }}</small>
                </td>
                <td>S/ {{ lineAmount(i).toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="row-actions">
        <button type="button" class="link" (click)="returnAll()">Devolver todo lo disponible</button>
        <strong>Total a devolver: S/ {{ total().toFixed(2) }}</strong>
      </div>
      @if (quantitiesTouched() && form.controls.quantities.hasError('empty')) {
        <small class="hint">Indica al menos un producto a devolver.</small>
      }

      <div class="fields two">
        <label
          ><span>Método de reembolso <span class="required">*</span></span>
          <select formControlName="refundMethod" [class.invalid]="showError('refundMethod')">
            @for (method of methods(); track method.code) { <option [value]="method.code">{{ method.name }}</option> }
          </select>
          @if (showError('refundMethod')) { <small class="hint">Selecciona el método de reembolso.</small> }
        </label>
        <label class="wide"
          ><span>Motivo <span class="required">*</span></span>
          <textarea formControlName="reason" maxlength="500" placeholder="Escribe el motivo de la devolución (producto defectuoso, cambio…)"
            [class.invalid]="showError('reason')"></textarea>
          @if (showError('reason')) { <small class="hint">Describe el motivo (mínimo 5 caracteres).</small> }
        </label>
      </div>
      <p class="muted">Los productos vuelven al stock del local y el reembolso sale de la caja abierta.</p>

      @if (error()) { <p class="hint" role="alert">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Emitiendo…' : 'Emitir nota de crédito' }}</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .credit { width: min(760px, calc(100vw - 40px)); }
    .table-scroll { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); white-space: nowrap; }
    td { padding: 8px 10px; border-top: 1px solid var(--color-border); white-space: nowrap; }
    td small { display: block; color: var(--color-text-muted); font-size: 11px; }
    td input { width: 80px; padding: 6px 8px; }
    tr.done { color: var(--color-text-muted); }
    .row-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .link { padding: 0; border: 0; color: var(--color-primary); background: none; font: inherit; font-weight: 600; cursor: pointer; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditNoteDialog implements OnInit {
  readonly data = inject<SaleCreditSummary>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CreditNoteDialog, CreditNoteDetail>);
  private readonly api = inject(CreditNoteApiService);
  private readonly posApi = inject(PosApiService);

  readonly methods = signal<readonly PaymentMethodOption[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    quantities: new FormArray(
      this.data.lines.map((line) => new FormControl<number | null>(
        { value: 0, disabled: line.available <= 0 },
        [Validators.min(0), Validators.max(line.available)],
      )),
      [anyQuantity],
    ),
    refundMethod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, trimmedMinLength(5), Validators.maxLength(500)] }),
  });

  private readonly quantityValues = toSignal(this.form.controls.quantities.valueChanges, {
    initialValue: this.form.controls.quantities.value,
  });

  /** Vista previa; el backend recalcula y ajusta el redondeo al devolver todo. */
  readonly total = computed(() => this.data.lines.reduce((sum, _, i) => sum + this.amountAt(i), 0));

  ngOnInit(): void {
    this.posApi.paymentMethods().subscribe({
      next: (methods) => {
        this.methods.set(methods);
        const cash = methods.find((m) => m.code === 'CASH') ?? methods[0];
        if (cash) this.form.controls.refundMethod.setValue(cash.code);
      },
      error: () => this.error.set('No se pudieron cargar los métodos de reembolso.'),
    });
  }

  lineAmount(i: number): number {
    return this.amountAt(i);
  }

  qtyInvalid(i: number): boolean {
    const control = this.form.controls.quantities.at(i);
    return control.invalid && (control.touched || control.dirty);
  }

  quantitiesTouched(): boolean {
    return this.form.controls.quantities.controls.some((c) => c.touched || c.dirty);
  }

  showError(name: 'refundMethod' | 'reason'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  returnAll(): void {
    this.data.lines.forEach((line, i) => {
      const control = this.form.controls.quantities.at(i);
      if (line.available > 0) {
        control.setValue(line.available);
        control.markAsDirty();
      }
    });
  }

  confirm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const quantities = this.form.controls.quantities.getRawValue();
    const lines = this.data.lines
      .map((line, i) => ({ productId: line.productId, quantity: quantities[i] ?? 0 }))
      .filter((line) => line.quantity > 0);
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create(this.data.saleId, {
        reason: this.form.controls.reason.value.trim(),
        refundMethod: this.form.controls.refundMethod.value,
        lines,
      })
      .subscribe({
        next: (note) => this.dialogRef.close(note),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(cashErrorMessage(cause, 'No se pudo emitir la nota de crédito.'));
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private amountAt(i: number): number {
    const qty = Number(this.quantityValues()[i] ?? 0);
    const line = this.data.lines[i];
    return qty > 0 && qty <= line.available ? Math.round(qty * line.unitPrice * 100) / 100 : 0;
  }
}

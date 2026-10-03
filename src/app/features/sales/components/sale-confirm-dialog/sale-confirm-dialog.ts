import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { formatSoles } from '../../../../shared/utils/diff-rows';

export interface SaleConfirmLine {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface SaleConfirmData {
  readonly customer: string;
  readonly lines: readonly SaleConfirmLine[];
  readonly discount: number;
  readonly paymentMethod: string;
  /** Un resumen por pago: monto, recibido/vuelto, voucher o n.º de operación. */
  readonly paymentDetails?: readonly string[];
}

/**
 * Figma `mod-confirmar-venta` (MOD-AD-18): último vistazo al carrito antes de registrar la venta. Pide el usuario
 * (código de 5 dígitos) de quien vende: la venta queda a su nombre. Se cierra con ese código (o `false`).
 */
@Component({
  selector: 'app-sale-confirm-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog review" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">shopping_cart</span>
        <div class="review__title"><h2>Confirmar venta</h2></div>
        <small class="review__code">MOD-AD-18</small>
      </header>

      <dl class="review__meta">
        <div><dt>Cliente</dt><dd>{{ data.customer }}</dd></div>
        <div><dt>Método de pago</dt><dd>{{ data.paymentMethod }}</dd></div>
        @for (detail of data.paymentDetails ?? []; track $index) {
          <div><dt>{{ $first ? 'Detalle del pago' : '' }}</dt><dd>{{ detail }}</dd></div>
        }
      </dl>

      <div class="table-scroll">
        <table class="review__diff">
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            @for (line of data.lines; track line.name) {
              <tr>
                <td>{{ line.name }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ soles(line.unitPrice) }}</td>
                <td>{{ soles(line.unitPrice * line.quantity) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <dl class="expected">
        <div><dt>Subtotal</dt><dd>{{ soles(subtotal) }}</dd></div>
        <div><dt>Descuento</dt><dd>-{{ soles(data.discount) }}</dd></div>
        <div><dt><strong>Total</strong></dt><dd class="total">{{ soles(subtotal - data.discount) }}</dd></div>
      </dl>

      <div class="fields">
        <label class="wide"
          ><span>Usuario del vendedor <span class="required">*</span></span>
          <input type="text" inputmode="numeric" maxlength="5" autocomplete="off" formControlName="sellerCode"
            placeholder="Escribe tu código de 5 dígitos" [class.invalid]="showError()" (input)="digitsOnly($event)" />
          @if (showError()) { <small class="hint">Ingresa el código de 5 dígitos con el que inicias sesión.</small> }
        </label>
      </div>

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid">Confirmar venta</button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: `
    .review__diff td:not(:first-child),
    .review__diff th:not(:first-child) { text-align: right; }
    .total { color: var(--color-primary); font-size: var(--font-size-lg); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleConfirmDialog {
  readonly data = inject<SaleConfirmData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SaleConfirmDialog, string | false>);
  readonly soles = formatSoles;
  readonly subtotal = this.data.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  readonly form = new FormGroup({
    sellerCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{5}$/)] }),
  });

  showError(): boolean {
    const control = this.form.controls.sellerCode;
    return control.invalid && (control.touched || control.dirty);
  }

  /** Solo dígitos en el código. */
  digitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 5);
    if (clean !== input.value) this.form.controls.sellerCode.setValue(clean);
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.controls.sellerCode.value);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
}

/** Figma `mod-confirmar-venta` (MOD-AD-18): último vistazo al carrito antes de registrar la venta. */
@Component({
  selector: 'app-sale-confirm-dialog',
  imports: [MatDialogModule],
  template: `
    <section class="dialog review">
      <header>
        <span class="material-icons">shopping_cart</span>
        <div class="review__title"><h2>Confirmar venta</h2></div>
        <small class="review__code">MOD-AD-18</small>
      </header>

      <dl class="review__meta">
        <div><dt>Cliente</dt><dd>{{ data.customer }}</dd></div>
        <div><dt>Método de pago</dt><dd>{{ data.paymentMethod }}</dd></div>
      </dl>

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

      <dl class="expected">
        <div><dt>Subtotal</dt><dd>{{ soles(subtotal) }}</dd></div>
        <div><dt>Descuento</dt><dd>-{{ soles(data.discount) }}</dd></div>
        <div><dt><strong>Total</strong></dt><dd class="total">{{ soles(subtotal - data.discount) }}</dd></div>
      </dl>

      <footer>
        <button type="button" (click)="close(false)">Cancelar</button>
        <button type="button" class="primary" (click)="close(true)">Confirmar venta</button>
      </footer>
    </section>
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
  private readonly dialogRef = inject(MatDialogRef<SaleConfirmDialog, boolean>);
  readonly soles = formatSoles;
  readonly subtotal = this.data.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}

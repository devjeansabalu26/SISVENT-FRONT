import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { formatSoles } from '../../../../shared/utils/diff-rows';

export interface PriceChangeData {
  readonly productName: string;
  readonly sku: string;
  readonly previousPrice: number;
  readonly newPrice: number;
}

export function priceVariation(previous: number, next: number): number | null {
  return previous > 0 ? Math.round(((next - previous) / previous) * 1000) / 10 : null;
}

@Component({
  selector: 'app-price-change-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog review" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">sell</span>
        <div class="review__title"><h2>Confirmar cambio de precio</h2></div>
        <small class="review__code">MOD-AD-15</small>
      </header>

      <dl class="review__meta">
        <div><dt>Producto</dt><dd>{{ data.productName }} ({{ data.sku }})</dd></div>
      </dl>

      <div class="review__kpis">
        <div><small>Precio anterior</small><strong>{{ soles(data.previousPrice) }}</strong></div>
        <div><small>Precio nuevo</small><strong>{{ soles(data.newPrice) }}</strong></div>
        <div>
          <small>Variación</small>
          <strong [class.up]="delta > 0" [class.down]="delta < 0">
            {{ delta > 0 ? '+' : '-' }}{{ soles(absDelta) }}
            @if (variation !== null) { · {{ variation > 0 ? '+' : '' }}{{ variation }}% }
          </strong>
        </div>
      </div>

      <div class="fields">
        <label class="wide"
          >Motivo del cambio *
          <textarea [formControl]="reason" placeholder="Escriba la justificación aquí..."></textarea>
          @if (reason.touched && reason.invalid) {
            <small class="hint">Indica el motivo (mínimo 5 caracteres).</small>
          }
        </label>
      </div>

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary">Confirmar cambio</button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: `
    .up { color: var(--color-success); }
    .down { color: var(--color-error); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceChangeDialog {
  readonly data = inject<PriceChangeData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PriceChangeDialog, string | undefined>);

  readonly delta = this.data.newPrice - this.data.previousPrice;
  readonly absDelta = Math.abs(this.delta);
  readonly variation = priceVariation(this.data.previousPrice, this.data.newPrice);
  readonly soles = formatSoles;

  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)],
  });

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(this.reason.value.trim());
  }
}

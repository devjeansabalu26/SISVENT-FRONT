import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StockAdjustmentRequest, StockAdjustmentType, StockRow } from '../../models/inventory-item.model';

const REASON_MAX_LENGTH = 500;

/** Stock que quedaría tras el movimiento (misma regla que aplica el backend). */
export function resultingStock(current: number, type: StockAdjustmentType, quantity: number): number {
  if (type === 'In') return current + quantity;
  if (type === 'Out') return current - quantity;
  return quantity;
}

/** Figma `mod-ajuste-stock` (MOD-AD-16). */
@Component({
  selector: 'app-stock-adjustment-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './stock-adjustment-dialog.html',
  styleUrls: [
    './stock-adjustment-dialog.scss',
    '../../../../shared/ui/review-dialog/review-dialog.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAdjustmentDialog {
  readonly item = inject<StockRow>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StockAdjustmentDialog, StockAdjustmentRequest | undefined>);

  readonly form = new FormGroup({
    type: new FormControl<StockAdjustmentType>('In', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(REASON_MAX_LENGTH)] }),
    observation: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly resulting = computed(() => {
    const value = this.value();
    return resultingStock(this.item.currentStock, value.type ?? 'In', Number(value.quantity) || 0);
  });

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    // El backend solo guarda un texto de motivo: la observación opcional se anexa a él.
    const observation = value.observation.trim();
    const reason = (observation ? `${value.reason.trim()} — Obs.: ${observation}` : value.reason.trim()).slice(0, REASON_MAX_LENGTH);
    this.dialogRef.close({
      storeId: this.item.storeId,
      productId: this.item.productId,
      type: value.type,
      quantity: value.quantity,
      minStock: null,
      reason,
    });
  }
}

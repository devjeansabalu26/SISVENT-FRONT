import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InventoryItem, StockAdjustment, StockMovementType } from '../../models/inventory-item.model';

@Component({ selector: 'app-stock-adjustment-dialog', imports: [MatDialogModule, ReactiveFormsModule], templateUrl: './stock-adjustment-dialog.html', styleUrl: './stock-adjustment-dialog.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class StockAdjustmentDialog {
  readonly item = inject<InventoryItem>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StockAdjustmentDialog, StockAdjustment | undefined>);
  readonly form = new FormGroup({
    type: new FormControl<StockMovementType>('IN', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
  });

  cancel(): void { this.dialogRef.close(); }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close({ itemId: this.item.id, ...this.form.getRawValue() });
  }
}

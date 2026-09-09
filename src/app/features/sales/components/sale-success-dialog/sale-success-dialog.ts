import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface SaleSuccessData {
  readonly saleNumber: string;
  readonly customer: string;
  readonly paymentMethod: string;
  readonly total: number;
}

export type SaleSuccessAction = 'print' | 'detail' | 'new';

@Component({
  selector: 'app-sale-success-dialog',
  imports: [MatDialogModule],
  templateUrl: './sale-success-dialog.html',
  styleUrl: './sale-success-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleSuccessDialog {
  readonly data = inject<SaleSuccessData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SaleSuccessDialog, SaleSuccessAction>);

  close(action: SaleSuccessAction): void {
    this.dialogRef.close(action);
  }
}

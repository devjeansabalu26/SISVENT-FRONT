import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface SaleSuccessData {
  readonly saleNumber: string;
  readonly customer: string;
  readonly paymentMethod: string;
  readonly total: number;
  /** Vuelto a entregar (solo efectivo). */
  readonly change?: number | null;
  readonly paymentDetails?: readonly string[];
  /** Correo del cliente: si existe se muestra junto al botón de envío. */
  readonly clientEmail?: string | null;
}

export type SaleSuccessAction = 'print' | 'detail' | 'email' | 'new';

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

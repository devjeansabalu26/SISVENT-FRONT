import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StatusChip } from '../status-chip/status-chip';
import { ReviewDialogData, ReviewTone } from './review-dialog.model';

const BANNER_ICON: Readonly<Record<ReviewTone, string>> = {
  info: 'info',
  warning: 'warning',
  danger: 'report',
  success: 'check_circle',
};

const DEFAULT_REASON_MIN_LENGTH = 5;

/**
 * Diálogo genérico de revisión / confirmación. Cubre los modales de Figma que muestran un resumen
 * (metadatos, transición de estado, KPIs, tabla antes/después, chips) antes de ejecutar una acción.
 * Se cierra con `true` al confirmar (o con el motivo escrito, si `data.reason` está definido) y
 * `false` al cancelar.
 */
@Component({
  selector: 'app-review-dialog',
  imports: [MatDialogModule, ReactiveFormsModule, StatusChip],
  templateUrl: './review-dialog.html',
  styleUrls: ['../../forms/dialog-form.scss', './review-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDialog {
  readonly data = inject<ReviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReviewDialog, boolean | string>);
  readonly bannerIcon = BANNER_ICON;
  readonly headers = this.data.diff?.headers ?? (['Campo', 'Antes', 'Después'] as const);
  readonly reasonMinLength = this.data.reason?.minLength ?? DEFAULT_REASON_MIN_LENGTH;
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: this.data.reason ? [Validators.required, Validators.minLength(this.reasonMinLength)] : [],
  });

  close(result: boolean): void {
    if (!result || !this.data.reason) {
      this.dialogRef.close(result);
      return;
    }
    if (this.reason.invalid || !this.reason.value.trim()) {
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(this.reason.value.trim());
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogData } from './confirm-dialog.model';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);
  readonly acknowledged = signal(false);

  close(result: boolean): void {
    if (result && this.data.acknowledgeLabel && !this.acknowledged()) return;
    this.dialogRef.close(result);
  }
}

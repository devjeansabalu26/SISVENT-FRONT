import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ResetAccessData {
  readonly username: string;
  readonly companyName: string;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!$%&*';
  return Array.from({ length: 11 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Component({
  selector: 'app-reset-access-dialog',
  imports: [MatDialogModule],
  templateUrl: './reset-access-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetAccessDialog {
  readonly data = inject<ResetAccessData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResetAccessDialog, boolean>);

  readonly password = signal(generatePassword());
  readonly forceChange = signal(true);
  readonly copied = signal(false);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}

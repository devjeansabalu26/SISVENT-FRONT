import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LocalFormValue, LocalItem } from '../../models/local.model';

@Component({
  selector: 'app-local-form-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './local-form-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalFormDialog {
  readonly local = inject<LocalItem | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LocalFormDialog, LocalFormValue | undefined>);

  readonly form = new FormGroup({
    name: new FormControl(this.local?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl(this.local?.address ?? '', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl(this.local?.phone ?? '', { nonNullable: true }),
    isActive: new FormControl(this.local?.status !== 'INACTIVE', { nonNullable: true }),
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
    this.dialogRef.close({ ...value, name: value.name.trim(), address: value.address.trim() });
  }
}

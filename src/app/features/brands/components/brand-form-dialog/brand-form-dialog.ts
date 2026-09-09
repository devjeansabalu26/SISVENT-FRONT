import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrandFormValue, BrandListItem } from '../../models/brand.model';

@Component({
  selector: 'app-brand-form-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './brand-form-dialog.html',
  styleUrl: './brand-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandFormDialog {
  readonly brand = inject<BrandListItem | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BrandFormDialog, BrandFormValue | undefined>);

  readonly form = new FormGroup({
    name: new FormControl(this.brand?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl(this.brand?.description ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    categories: new FormControl(this.brand?.categories.join(', ') ?? '', { nonNullable: true }),
    isActive: new FormControl(this.brand?.status !== 'INACTIVE', { nonNullable: true }),
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
    this.dialogRef.close({
      name: value.name.trim(),
      description: value.description.trim(),
      categories: value.categories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: value.isActive,
    });
  }
}

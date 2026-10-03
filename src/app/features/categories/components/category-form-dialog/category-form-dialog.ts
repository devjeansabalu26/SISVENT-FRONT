import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CategoryFormData, CategoryFormValue } from '../../models/category.model';

@Component({
  selector: 'app-category-form-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './category-form-dialog.html',
  styleUrl: './category-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialog {
  private readonly data = inject<CategoryFormData>(MAT_DIALOG_DATA);
  readonly category = this.data.category;
  readonly hasChildren = this.data.hasChildren;
  /** Solo principales activas y distintas de la que se edita. */
  readonly parents = this.data.parents.filter((parent) => parent.id !== this.category?.id && (parent.isActive || parent.id === this.category?.parentId));
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialog, CategoryFormValue | undefined>);

  readonly form = new FormGroup({
    name: new FormControl(this.category?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    description: new FormControl(this.category?.description ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(400)],
    }),
    isActive: new FormControl(this.category?.isActive ?? true, { nonNullable: true }),
    parentId: new FormControl<string>({ value: this.category?.parentId ?? '', disabled: this.data.hasChildren }, { nonNullable: true }),
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
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      parentId: value.parentId || null,
    });
  }
}

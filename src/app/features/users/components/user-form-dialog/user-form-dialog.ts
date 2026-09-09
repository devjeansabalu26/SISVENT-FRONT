import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { APP_ROLES, AppRole } from '../../../../core/auth/constants/app-role.constant';
import { UserFormValue, UserListItem, UserStatus } from '../../models/user.model';

@Component({ selector: 'app-user-form-dialog', imports: [MatDialogModule, ReactiveFormsModule], templateUrl: './user-form-dialog.html', styleUrl: './user-form-dialog.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class UserFormDialog {
  readonly user = inject<UserListItem | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, UserFormValue | undefined>);
  readonly roles = APP_ROLES;
  readonly form = new FormGroup({
    fullName: new FormControl(this.user?.fullName ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    email: new FormControl(this.user?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    document: new FormControl(this.user?.document ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{8,11}$/)] }),
    role: new FormControl<AppRole>(this.user?.role ?? 'VENDEDOR', { nonNullable: true, validators: [Validators.required] }),
    branch: new FormControl(this.user?.branch ?? 'Principal', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<UserStatus>(this.user?.status ?? 'ACTIVE', { nonNullable: true, validators: [Validators.required] }),
  });

  cancel(): void { this.dialogRef.close(); }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }
}

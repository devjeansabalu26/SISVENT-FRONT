import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StoreApiService } from '../../../locales/data-access/store-api.service';
import { AppUser, UserFormValue } from '../../models/user.model';

@Component({
  selector: 'app-user-form-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialog implements OnInit {
  readonly user = inject<AppUser | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog, UserFormValue | undefined>);
  private readonly storeApi = inject(StoreApiService);

  readonly stores = signal<readonly { id: string; name: string }[]>([]);

  readonly form = new FormGroup({
    firstName: new FormControl(this.user?.fullName.split(' ')[0] ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    lastName: new FormControl(this.user?.fullName.split(' ').slice(1).join(' ') ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    email: new FormControl(this.user?.email ?? '', {
      nonNullable: true,
      validators: this.user ? [] : [Validators.required, Validators.email],
    }),
    document: new FormControl(this.user?.document ?? '', { nonNullable: true }),
    phone: new FormControl(this.user?.phone ?? '', { nonNullable: true }),
    role: new FormControl<'ADMIN' | 'VENDEDOR'>(this.user?.role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    storeId: new FormControl<string | null>(this.user?.storeId ?? null, { nonNullable: false }),
    canViewAllStores: new FormControl(this.user?.canViewAllStores ?? false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.storeApi.list().subscribe((response) => this.stores.set(response.items));
    if (this.user) this.form.controls.email.disable();
  }

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
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: this.user ? undefined : value.email.trim(),
      phone: value.phone.trim() || null,
      document: value.document.trim() || null,
      role: value.role,
      storeId: value.role === 'VENDEDOR' ? value.storeId : null,
      canViewAllStores: value.role === 'VENDEDOR' && value.canViewAllStores,
    });
  }
}

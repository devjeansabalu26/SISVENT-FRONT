import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SupplierApiService } from '../data-access/supplier-api.service';
import { Supplier } from '../models/supplier.model';

@Component({
  selector: 'app-supplier-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './supplier-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(SupplierApiService);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly isEdit = !!this.id;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  private existing: Supplier | null = null;

  readonly form = new FormGroup({
    taxDocument: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{8,11}$/)] }),
    businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contactName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    address: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (!this.id) return;
    this.api.get(this.id).subscribe({
      next: (supplier) => {
        this.existing = supplier;
        this.form.patchValue({
          taxDocument: supplier.taxDocument ?? '',
          businessName: supplier.businessName,
          contactName: supplier.contactName ?? '',
          phone: supplier.phone ?? '',
          email: supplier.email ?? '',
          address: supplier.address ?? '',
          notes: supplier.notes ?? '',
          isActive: supplier.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar el proveedor.', 'error');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      taxDocument: value.taxDocument.trim() || null,
      businessName: value.businessName.trim(),
      contactName: value.contactName.trim() || null,
      phone: value.phone.trim() || null,
      email: value.email.trim() || null,
      address: value.address.trim() || null,
      notes: value.notes.trim() || null,
      isActive: value.isActive,
    };
    this.saving.set(true);
    const request = this.existing
      ? this.api.update(this.existing.id, { ...body, version: this.existing.version })
      : this.api.create(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.show(`Proveedor ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
        void this.router.navigateByUrl('/app/suppliers');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.messageFor(cause), 'error');
      },
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'Conflicto: el documento ya existe o el registro cambió.';
      if (cause.status === 403) return 'No tienes permiso para gestionar proveedores.';
      if (cause.status === 400) return 'Revisa los datos ingresados.';
    }
    return `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} el proveedor.`;
  }
}

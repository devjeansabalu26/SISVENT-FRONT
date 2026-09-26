import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CustomerApiService } from '../data-access/customer-api.service';
import { CustomerDetail } from '../models/customer.model';

@Component({
  selector: 'app-customer-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './customer-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(CustomerApiService);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly isEdit = !!this.id;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  private existing: CustomerDetail | null = null;

  readonly form = new FormGroup({
    documentType: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8,11}$/)],
    }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    address: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (!this.id) return;
    this.api.get(this.id).subscribe({
      next: (customer) => {
        this.existing = customer;
        this.form.patchValue({
          documentType: customer.documentType ?? 'DNI',
          documentNumber: customer.documentNumber ?? '',
          displayName: customer.displayName,
          firstName: customer.firstName ?? '',
          lastName: customer.lastName ?? '',
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          address: customer.address ?? '',
          notes: customer.notes ?? '',
          active: customer.isActive,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar el cliente.', 'error');
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
      displayName: value.displayName.trim(),
      firstName: value.firstName.trim() || null,
      lastName: value.lastName.trim() || null,
      documentType: value.documentType.trim() || null,
      documentNumber: value.documentNumber.trim() || null,
      email: value.email.trim() || null,
      phone: value.phone.trim() || null,
      address: value.address.trim() || null,
      notes: value.notes.trim() || null,
      isActive: value.active,
    };
    this.saving.set(true);
    const request = this.existing
      ? this.api.update(this.existing.id, { ...body, version: this.existing.version })
      : this.api.create(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.show(`Cliente ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
        void this.router.navigateByUrl('/app/customers');
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
      if (cause.status === 403) return 'No tienes permiso para gestionar clientes.';
      if (cause.status === 400) return 'Revisa los datos ingresados.';
    }
    return `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} el cliente.`;
  }
}

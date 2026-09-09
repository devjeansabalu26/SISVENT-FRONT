import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SUPPLIER_MOCK } from '../data-access/supplier.mock';

@Component({
  selector: 'app-supplier-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './supplier-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly existing = SUPPLIER_MOCK.find(
    (item) => item.id === inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );

  readonly isEdit = !!this.existing;

  readonly form = new FormGroup({
    documentType: new FormControl('RUC', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl(this.existing?.taxId ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8,11}$/)],
    }),
    legalName: new FormControl(this.existing?.legalName ?? '', { nonNullable: true, validators: [Validators.required] }),
    commercialName: new FormControl(this.existing?.commercialName ?? '', { nonNullable: true }),
    sector: new FormControl(this.existing?.sector ?? '', { nonNullable: true }),
    contactName: new FormControl(this.existing?.contactName ?? '', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl(this.existing?.phone ?? '', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true }),
    region: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(this.existing?.status !== 'INACTIVE', { nonNullable: true }),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show(`Proveedor ${this.isEdit ? 'actualizado' : 'guardado'} correctamente.`, 'success');
    void this.router.navigateByUrl('/app/suppliers');
  }
}

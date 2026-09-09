import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CUSTOMER_MOCK } from '../data-access/customer.mock';

@Component({
  selector: 'app-customer-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './customer-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly existing = CUSTOMER_MOCK.find(
    (item) => item.id === inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );

  readonly isEdit = !!this.existing;

  readonly form = new FormGroup({
    documentType: new FormControl(this.existing?.type === 'COMPANY' ? 'RUC' : 'DNI', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    document: new FormControl(this.existing?.document.replace(/\D/g, '') ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8,11}$/)],
    }),
    names: new FormControl(this.existing?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    lastNames: new FormControl('', { nonNullable: true }),
    legalName: new FormControl('', { nonNullable: true }),
    phone: new FormControl(this.existing?.phone ?? '', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl(this.existing?.email === '-' ? '' : this.existing?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    district: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show(`Cliente ${this.isEdit ? 'actualizado' : 'guardado'} correctamente.`, 'success');
    void this.router.navigateByUrl('/app/customers');
  }
}

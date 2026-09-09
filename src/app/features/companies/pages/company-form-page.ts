import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { COMPANY_MOCK } from '../data-access/company.mock';

const COLOR_TEMPLATES = ['Default', 'Purple Trend', 'Ocean Blue', 'Emerald Mint', 'Warm Sunset', 'Carbon Noir'] as const;

@Component({
  selector: 'app-company-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './company-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './company-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly existing = COMPANY_MOCK.find(
    (item) => item.id === inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );

  readonly isEdit = !!this.existing;
  readonly colorTemplates = COLOR_TEMPLATES;
  readonly steps = ['Empresa', 'Administrador', 'Vigencia', 'Identidad visual'];

  readonly form = new FormGroup({
    commercialName: new FormControl(this.existing?.commercialName ?? '', { nonNullable: true, validators: [Validators.required] }),
    legalName: new FormControl(this.existing?.legalName ?? '', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl(this.existing?.taxId ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
    sector: new FormControl('', { nonNullable: true }),
    companyPhone: new FormControl('', { nonNullable: true }),
    companyEmail: new FormControl(this.existing?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    legalAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adminFirstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adminLastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adminEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    adminUser: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adminPhone: new FormControl('', { nonNullable: true }),
    adminDocument: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl(this.existing?.startDate ?? '', { nonNullable: true, validators: [Validators.required] }),
    expiration: new FormControl(this.existing?.expiration ?? '', { nonNullable: true, validators: [Validators.required] }),
    initialStatus: new FormControl('ACTIVA', { nonNullable: true, validators: [Validators.required] }),
    colorTemplate: new FormControl<string>('Default', { nonNullable: true }),
    primaryColor: new FormControl('#2563EB', { nonNullable: true }),
    accentColor: new FormControl('#10B981', { nonNullable: true }),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show(`Empresa ${this.isEdit ? 'actualizada' : 'creada'} correctamente.`, 'success');
    void this.router.navigateByUrl('/app/companies');
  }
}

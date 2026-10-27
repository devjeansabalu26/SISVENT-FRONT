import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { problemTitle } from '../../../countries/models/country.model';
import { EINVOICE_STATUS_LABEL } from '../../../sales/utils/sale-document';
import { CompanyApiService } from '../../data-access/company-api.service';
import {
  BlockedRucLookupUser,
  CompanyEInvoicing,
  ConnectionTestResult,
  EInvoicingCredentialMode,
  EInvoicingEnvironment,
} from '../../models/company-einvoicing.model';

@Component({
  selector: 'app-company-einvoicing-tab',
  imports: [ReactiveFormsModule, DateTimePipe],
  templateUrl: './company-einvoicing-tab.html',
  styleUrls: ['../company-regional-tab/company-regional-tab.scss', './company-einvoicing-tab.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyEInvoicingTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);

  readonly companyId = input.required<string>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly testResult = signal<ConnectionTestResult | null>(null);
  readonly data = signal<CompanyEInvoicing | null>(null);
  readonly statusLabel = EINVOICE_STATUS_LABEL;
  readonly blockedUsers = signal<readonly BlockedRucLookupUser[]>([]);
  readonly unblocking = signal<string | null>(null);

  readonly form = new FormGroup({
    credentialMode: new FormControl<EInvoicingCredentialMode>('DESACTIVADA', { nonNullable: true }),
    providerCode: new FormControl('', { nonNullable: true }),
    environment: new FormControl<EInvoicingEnvironment>('PRUEBAS', { nonNullable: true }),
    apiUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300), Validators.pattern(/^(https:\/\/\S+)?$/)] }),
    apiToken: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    clearApiToken: new FormControl(false, { nonNullable: true }),
    providerCompanyId: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    fiscalAddress: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] }),
    ubigeo: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^(\d{6})?$/)] }),
    establishmentCode: new FormControl('0000', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{4}$/)] }),
    creditNoteSeries: new FormControl('FC01', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[Ff][A-Za-z0-9]{3}$/)] }),
    nextInvoiceNumber: new FormControl<number | null>(null, { validators: [Validators.min(1), Validators.max(99999999)] }),
    checklistProviderRegistered: new FormControl(false, { nonNullable: true }),
    checklistSolAffiliation: new FormControl(false, { nonNullable: true }),
    checklistCertificate: new FormControl(false, { nonNullable: true }),
    checklistSandboxTested: new FormControl(false, { nonNullable: true }),
  });

  private readonly mode = signal<EInvoicingCredentialMode>('DESACTIVADA');
  private readonly providerCode = signal('');
  private readonly checklistComplete = signal(false);

  readonly isShared = computed(() => this.mode() === 'GENERAL');
  readonly isOwn = computed(() => this.mode() === 'PROPIA');
  readonly isDisabled = computed(() => this.mode() === 'DESACTIVADA');
  readonly selectedProvider = computed(() => {
    const info = this.data();
    if (!info) return null;
    const code = this.isShared() ? info.shared.providerCode : this.providerCode();
    return info.providers.find((p) => p.code === code) ?? null;
  });
  readonly productionBlocked = computed(() => !this.checklistComplete() || !!this.selectedProvider()?.testOnly);
  readonly countGroups = computed(() => {
    const counts = this.data()?.counts ?? [];
    return [
      { label: 'Facturas', items: counts.filter((c) => c.kind === 'FACTURA') },
      { label: 'Notas de crédito', items: counts.filter((c) => c.kind === 'NOTA_CREDITO') },
    ].filter((group) => group.items.length);
  });

  ngOnInit(): void {
    const controls = this.form.controls;
    controls.credentialMode.valueChanges.subscribe((mode) => {
      this.mode.set(mode);
      this.testResult.set(null);
    });
    controls.providerCode.valueChanges.subscribe((code) => this.providerCode.set(code));
    for (const control of [controls.checklistProviderRegistered, controls.checklistSolAffiliation, controls.checklistCertificate, controls.checklistSandboxTested]) {
      control.valueChanges.subscribe(() => this.syncChecklist());
    }
    this.load();
    this.loadBlocked();
  }

  loadBlocked(): void {
    this.api.blockedRucLookups(this.companyId()).subscribe({
      next: (users) => this.blockedUsers.set(users),
      error: () => this.blockedUsers.set([]),
    });
  }

  unblock(user: BlockedRucLookupUser): void {
    if (this.unblocking()) return;
    this.unblocking.set(user.identityUserId);
    this.api.unblockRucLookup(this.companyId(), user.identityUserId).subscribe({
      next: () => {
        this.unblocking.set(null);
        this.notifications.show(`Consulta de RUC reactivada para ${user.name}.`, 'success');
        this.loadBlocked();
      },
      error: (cause: unknown) => {
        this.unblocking.set(null);
        this.notifications.show(problemTitle(cause, 'No se pudo reactivar la consulta de RUC.'), 'error');
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.getEInvoicing(this.companyId()).subscribe({
      next: (result) => this.apply(result),
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar la configuración de facturación.', 'error');
      },
    });
  }

  discard(): void {
    const current = this.data();
    if (current) this.apply(current);
  }

  testConnection(): void {
    if (this.testing()) return;
    if (this.form.dirty) {
      this.notifications.show('Guarda los cambios antes de probar la conexión: la prueba usa la configuración guardada.', 'warning');
      return;
    }
    this.testing.set(true);
    this.testResult.set(null);
    this.api.testEInvoicing(this.companyId()).subscribe({
      next: (result) => {
        this.testing.set(false);
        this.testResult.set(result);
      },
      error: (cause: unknown) => {
        this.testing.set(false);
        this.testResult.set({ ok: false, message: problemTitle(cause, 'No se pudo probar la conexión.') });
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.environment === 'PRODUCCION' && this.productionBlocked()) {
      this.notifications.show('Para pasar a Producción completa el checklist de alta.', 'warning');
      return;
    }
    const own = value.credentialMode === 'PROPIA';
    this.saving.set(true);
    this.api
      .updateEInvoicing(this.companyId(), {
        credentialMode: value.credentialMode,
        providerCode: own ? value.providerCode || null : null,
        environment: value.environment,
        apiUrl: own ? value.apiUrl.trim() || null : null,
        apiToken: own ? value.apiToken.trim() || null : null,
        clearApiToken: value.clearApiToken,
        providerCompanyId: value.providerCompanyId.trim() || null,
        fiscalAddress: value.fiscalAddress.trim() || null,
        ubigeo: value.ubigeo.trim() || null,
        establishmentCode: value.establishmentCode.trim(),
        creditNoteSeries: value.creditNoteSeries.trim().toUpperCase(),
        nextInvoiceNumber: value.nextInvoiceNumber,
        checklistProviderRegistered: value.checklistProviderRegistered,
        checklistSolAffiliation: value.checklistSolAffiliation,
        checklistCertificate: value.checklistCertificate,
        checklistSandboxTested: value.checklistSandboxTested,
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.apply(result);
          this.notifications.show('Configuración de facturación guardada.', 'success');
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          this.notifications.show(problemTitle(cause, 'No se pudo guardar la configuración de facturación.'), 'error');
        },
      });
  }

  private syncChecklist(): void {
    const value = this.form.getRawValue();
    const complete = value.checklistProviderRegistered && value.checklistSolAffiliation && value.checklistCertificate && value.checklistSandboxTested;
    this.checklistComplete.set(complete);
    if (!complete && value.environment === 'PRODUCCION') this.form.controls.environment.setValue('PRUEBAS');
  }

  private apply(result: CompanyEInvoicing): void {
    this.data.set(result);
    this.testResult.set(null);
    const ownProvider = result.providers.find((p) => p.code === result.providerCode) ?? result.providers.find((p) => !p.testOnly) ?? null;
    this.form.reset({
      credentialMode: result.credentialMode,
      providerCode: ownProvider?.code ?? '',
      environment: result.environment,
      apiUrl: result.apiUrl ?? '',
      apiToken: '',
      clearApiToken: false,
      providerCompanyId: result.providerCompanyId ?? '',
      fiscalAddress: result.fiscalAddress ?? '',
      ubigeo: result.ubigeo ?? '',
      establishmentCode: result.establishmentCode,
      creditNoteSeries: result.creditNoteSeries,
      nextInvoiceNumber: null,
      checklistProviderRegistered: result.checklist.providerRegistered,
      checklistSolAffiliation: result.checklist.solAffiliation,
      checklistCertificate: result.checklist.certificate,
      checklistSandboxTested: result.checklist.sandboxTested,
    });
    this.mode.set(result.credentialMode);
    this.providerCode.set(ownProvider?.code ?? '');
    this.syncChecklist();
    this.loading.set(false);
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { SUNAT_FEATURE_CODES } from '../../../../core/auth/constants/plan-features.constant';
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

interface SunatFeature {
  readonly code: string;
  readonly title: string;
  readonly detail: string;
  readonly inPlan: boolean;
  readonly extra: boolean;
}

const SUNAT_COPY: Readonly<Record<string, { readonly title: string; readonly detail: string }>> = {
  E_INVOICING: {
    title: 'Emitir comprobantes electrónicos',
    detail: 'El POS emite facturas con RUC, serie y correlativo, y se envían a SUNAT según la configuración del envío.',
  },
  RUC_LOOKUP: {
    title: 'Consultar RUC en SUNAT',
    detail: 'Al registrar un cliente con RUC, completa su razón social y dirección. No emite comprobantes.',
  },
};

@Component({
  selector: 'app-company-einvoicing-tab',
  imports: [ReactiveFormsModule, DateTimePipe],
  templateUrl: './company-einvoicing-tab.html',
  styleUrls: ['../../../../shared/forms/switch.scss', '../company-regional-tab/company-regional-tab.scss', './company-einvoicing-tab.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyEInvoicingTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);

  readonly companyId = input.required<string>();

  readonly sunatFeatures = signal<readonly SunatFeature[]>([]);
  readonly sunatLoaded = signal(false);
  readonly rucFeature = computed(() => this.sunatFeatures().find((f) => f.code === 'RUC_LOOKUP') ?? null);
  readonly invoiceFeature = computed(() => this.sunatFeatures().find((f) => f.code === 'E_INVOICING') ?? null);
  readonly rucLookupActive = computed(() => {
    const feature = this.rucFeature();
    return !!feature && (feature.inPlan || feature.extra);
  });
  readonly sunatDraft = signal<ReadonlyMap<string, boolean>>(new Map());
  readonly savingSunat = signal<string | null>(null);

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
    this.loadSunatFeatures();
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
    if (this.unblocking() || !this.rucLookupActive()) return;
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

  sunatOn(feature: SunatFeature): boolean {
    return feature.inPlan || (this.sunatDraft().get(feature.code) ?? feature.extra);
  }

  toggleSunat(feature: SunatFeature, enabled: boolean): void {
    const next = new Map(this.sunatDraft());
    next.set(feature.code, enabled);
    this.sunatDraft.set(next);
  }

  sunatChanged(feature: SunatFeature): boolean {
    return !feature.inPlan && this.sunatDraft().has(feature.code) && this.sunatDraft().get(feature.code) !== feature.extra;
  }

  discardSunat(feature: SunatFeature): void {
    const next = new Map(this.sunatDraft());
    next.delete(feature.code);
    this.sunatDraft.set(next);
  }

  saveSunat(target: SunatFeature): void {
    if (!this.sunatChanged(target) || this.savingSunat()) return;
    const enabled = this.sunatOn(target);
    this.savingSunat.set(target.code);
    this.api
      .getExtraFeatures(this.companyId())
      .pipe(
        switchMap((fresh) => {
          const codes = fresh.features
            .filter((f) => f.extra && f.code !== target.code)
            .map((f) => f.code);
          if (enabled) codes.push(target.code);
          return this.api.updateExtraFeatures(this.companyId(), codes, 'Configurado en Envío a SUNAT');
        }),
      )
      .subscribe({
        next: (result) => {
          this.savingSunat.set(null);
          const kept = new Map(this.sunatDraft());
          kept.delete(target.code);
          this.applySunat(result.features, kept);
          this.notifications.show(
            `${target.title}: ${enabled ? 'activada' : 'desactivada'}. La empresa lo verá al recargar o volver a iniciar sesión.`,
            'success',
          );
        },
        error: () => {
          this.savingSunat.set(null);
          this.notifications.show(`No se pudo guardar «${target.title}». Inténtalo de nuevo.`, 'error');
        },
      });
  }

  private loadSunatFeatures(): void {
    this.api.getExtraFeatures(this.companyId()).subscribe({
      next: (result) => this.applySunat(result.features),
      error: () => {
        this.sunatLoaded.set(true);
        this.notifications.show('No se pudieron cargar las opciones de SUNAT de la empresa.', 'error');
      },
    });
  }

  private applySunat(
    features: readonly { readonly code: string; readonly inPlan: boolean; readonly extra: boolean }[],
    draft: ReadonlyMap<string, boolean> = new Map(),
  ): void {
    const list: SunatFeature[] = [];
    for (const code of SUNAT_FEATURE_CODES) {
      const feature = features.find((f) => f.code === code);
      const copy = SUNAT_COPY[code];
      if (feature && copy) list.push({ code, title: copy.title, detail: copy.detail, inPlan: feature.inPlan, extra: feature.extra });
    }
    this.sunatFeatures.set(list);
    this.sunatDraft.set(draft);
    this.sunatLoaded.set(true);
  }
}

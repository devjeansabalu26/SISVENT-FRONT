import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, merge, startWith } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { HEX_COLOR_MAX_LENGTH, hexColorValidator, normalizeHexInput } from '../../../shared/forms/hex-color';
import { CredentialDialog, CredentialDialogData } from '../../../shared/ui/credential-dialog/credential-dialog';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { DiffField, buildDiffRows, formatSoles } from '../../../shared/utils/diff-rows';
import { PlanApiService } from '../../plans/data-access/plan-api.service';
import { Plan } from '../../plans/models/plan.model';
import {
  COMPANY_THEME_PRESETS,
  CompanyThemeColors,
  CompanyThemePreset,
  DEFAULT_COMPANY_THEME_PRESET,
  matchThemePreset,
} from '../constants/company-theme-presets.constant';
import { CompanyApiService } from '../data-access/company-api.service';
import { CompanyDetail } from '../models/company.model';

type ThemeColorField = 'primaryColor' | 'secondaryColor' | 'backgroundColor';

@Component({
  selector: 'app-company-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './company-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './company-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(CompanyApiService);
  private readonly planApi = inject(PlanApiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly isEdit = !!this.id;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly plans = signal<readonly Plan[]>([]);
  readonly steps = ['Empresa', 'Administrador', 'Vigencia'];
  private existing: CompanyDetail | null = null;
  /** Valores del formulario recién precargado en edición: base del "Resumen de cambios" (MOD-SA-08). */
  private initialValue: CompanyFormValue | null = null;

  // Campos obligatorios (marcados con *) de cada card del stepper, en el mismo orden que `steps`.
  // Un card se marca "completo" cuando todos sus campos obligatorios son válidos (Validators.required
  // ya cubre "vacío"), sin exigir los campos opcionales de esa misma sección.
  private readonly stepFields: readonly (readonly string[])[] = [
    this.isEdit
      ? ['tradeName', 'legalName', 'companyEmail', 'legalAddress']
      : ['tradeName', 'legalName', 'taxId', 'companyEmail', 'legalAddress'],
    this.isEdit
      ? ['adminFirstName', 'adminLastName', 'adminEmail']
      : ['adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword'],
    ['planId', 'startDate', 'endDate', 'firstStoreName'],
  ];
  readonly stepsCompleted = signal<readonly boolean[]>(this.steps.map(() => false));

  readonly hexMaxLength = HEX_COLOR_MAX_LENGTH;
  readonly showAdminPassword = signal(false);
  readonly themePresets = COMPANY_THEME_PRESETS;
  readonly selectedPresetId = signal<string | null>(DEFAULT_COMPANY_THEME_PRESET.id);
  readonly themePreview = signal<CompanyThemeColors>({
    primaryColor: DEFAULT_COMPANY_THEME_PRESET.primaryColor,
    secondaryColor: DEFAULT_COMPANY_THEME_PRESET.secondaryColor,
    accentColor: DEFAULT_COMPANY_THEME_PRESET.accentColor,
    backgroundColor: DEFAULT_COMPANY_THEME_PRESET.backgroundColor,
  });

  readonly form = new FormGroup({
    tradeName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    legalName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
    businessType: new FormControl('', { nonNullable: true }),
    companyPhone: new FormControl('', { nonNullable: true }),
    companyEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    legalAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    internalNotes: new FormControl('', { nonNullable: true }),
    // Create-only:
    planId: new FormControl('', { nonNullable: true }),
    contractedPrice: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    adminFirstName: new FormControl('', { nonNullable: true }),
    adminLastName: new FormControl('', { nonNullable: true }),
    adminEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    adminPhone: new FormControl('', { nonNullable: true }),
    adminDocument: new FormControl('', { nonNullable: true }),
    adminPassword: new FormControl('', { nonNullable: true }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    initialStatus: new FormControl('ACTIVE', { nonNullable: true }),
    primaryColor: new FormControl(DEFAULT_COMPANY_THEME_PRESET.primaryColor, { nonNullable: true }),
    secondaryColor: new FormControl(DEFAULT_COMPANY_THEME_PRESET.secondaryColor, { nonNullable: true }),
    accentColor: new FormControl(DEFAULT_COMPANY_THEME_PRESET.accentColor, { nonNullable: true }),
    backgroundColor: new FormControl(DEFAULT_COMPANY_THEME_PRESET.backgroundColor, { nonNullable: true }),
    firstStoreName: new FormControl('Local Principal', { nonNullable: true }),
  });

  ngOnInit(): void {
    // The edit screen is the create screen in edit mode: same FormGroup, same
    // sections, same validators — only pre-filled and routed to PUT.
    this.addSharedValidators();
    this.watchThemeColors();
    this.watchStepCompletion();
    this.planApi.list().subscribe((plans) => {
      this.plans.set(plans);
      if (!this.isEdit && plans.length) this.form.controls.planId.setValue(plans[0].id);
      else this.resolvePlanSelection();
    });

    if (!this.isEdit) {
      this.addCreateValidators();
      return;
    }
    this.api.get(this.id!).subscribe({
      next: (company) => {
        this.existing = company;
        this.patchFromCompany(company);
        this.resolvePlanSelection();
        this.initialValue = this.form.getRawValue();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar la empresa.', 'error');
      },
    });
  }

  /** Prefills every section from the existing company (create-only fields excluded). */
  private patchFromCompany(company: CompanyDetail): void {
    const preset = DEFAULT_COMPANY_THEME_PRESET;
    // The backend sends first/last name split; if only the combined `administratorName`
    // is available, fall back to splitting on the first whitespace.
    const nameParts = (company.administratorName ?? '').trim().split(/\s+/).filter(Boolean);
    const derivedFirst = company.administratorFirstName ?? nameParts[0] ?? '';
    const derivedLast = company.administratorLastName ?? nameParts.slice(1).join(' ');
    this.form.patchValue({
      tradeName: company.tradeName,
      legalName: company.legalName ?? '',
      taxId: company.taxDocument,
      businessType: company.businessType ?? '',
      companyPhone: company.phone ?? '',
      companyEmail: company.email ?? '',
      legalAddress: company.address ?? '',
      internalNotes: company.internalNotes ?? '',
      adminFirstName: derivedFirst,
      adminLastName: derivedLast,
      adminEmail: company.administratorEmail ?? '',
      adminPhone: company.administratorPhone ?? '',
      adminDocument: company.administratorDocument ?? '',
      planId: company.planId ?? '',
      contractedPrice: company.contractedPrice ?? 0,
      initialStatus: company.status,
      startDate: company.planStart ?? '',
      endDate: company.planEnd ?? '',
      firstStoreName: company.firstStoreName ?? 'Local Principal',
      primaryColor: (company.primaryColor ?? preset.primaryColor).toUpperCase(),
      secondaryColor: (company.secondaryColor ?? preset.secondaryColor).toUpperCase(),
      accentColor: (company.accentColor ?? preset.accentColor).toUpperCase(),
      backgroundColor: (company.backgroundColor ?? preset.backgroundColor).toUpperCase(),
    });
  }

  /**
   * Selects the company's current plan in the dropdown. Uses `planId` when the
   * backend provides it; otherwise matches the loaded plans by `planCode`.
   * Runs after both the plan list and the company have loaded (whichever is last).
   */
  private resolvePlanSelection(): void {
    if (!this.isEdit) return;
    const control = this.form.controls.planId;
    if (control.value) return;
    const plans = this.plans();
    const code = this.existing?.planCode;
    if (!plans.length || !code) return;
    const match = plans.find((plan) => plan.code === code);
    if (match) control.setValue(match.id);
  }

  /** Validators that apply to both create and edit (the full form is shared). */
  private addSharedValidators(): void {
    this.form.controls.planId.addValidators(Validators.required);
    this.form.controls.adminFirstName.addValidators(Validators.required);
    this.form.controls.adminLastName.addValidators(Validators.required);
    this.form.controls.adminEmail.addValidators([Validators.required, Validators.email]);
    this.form.controls.startDate.addValidators(Validators.required);
    this.form.controls.endDate.addValidators(Validators.required);
    this.form.controls.firstStoreName.addValidators(Validators.required);
    this.form.controls.primaryColor.addValidators(hexColorValidator);
    this.form.controls.secondaryColor.addValidators(hexColorValidator);
    this.form.controls.backgroundColor.addValidators(hexColorValidator);
    this.form.updateValueAndValidity();
  }

  /** Validators only meaningful when provisioning a new tenant. */
  private addCreateValidators(): void {
    this.form.controls.taxId.addValidators(Validators.required);
    this.form.controls.adminPassword.addValidators([Validators.required, Validators.pattern(/^\d{5}$/)]);
    this.form.updateValueAndValidity();
  }

  /** Recalcula qué cards del stepper están completas cada vez que cambia el formulario (tecleo, patchValue,
   * o que se agreguen/quiten validadores de creación). `startWith` fuerza un primer cálculo al suscribirse. */
  private watchStepCompletion(): void {
    merge(this.form.valueChanges, this.form.statusChanges)
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.stepsCompleted.set(this.computeStepsCompleted()));
  }

  /** Una card está completa cuando todos sus campos obligatorios (los marcados con *) son válidos; los
   * campos opcionales de esa misma sección no se exigen. */
  private computeStepsCompleted(): readonly boolean[] {
    const controls = this.form.controls as unknown as Record<string, AbstractControl>;
    return this.stepFields.map((fields) => fields.every((name) => controls[name].valid));
  }

  /** Keeps the live preview and the highlighted preset in sync with the colour controls. */
  private watchThemeColors(): void {
    merge(
      this.form.controls.primaryColor.valueChanges,
      this.form.controls.secondaryColor.valueChanges,
      this.form.controls.accentColor.valueChanges,
      this.form.controls.backgroundColor.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshTheme());
    this.refreshTheme();
  }

  /**
   * Recomputes the preview and the highlighted preset from the current control
   * values. Every entry point (presets, hex input, colour picker, defaults)
   * already stores canonical `#RRGGBB`, so this only reads.
   */
  private refreshTheme(): void {
    const colors: CompanyThemeColors = {
      primaryColor: this.form.controls.primaryColor.value,
      secondaryColor: this.form.controls.secondaryColor.value,
      accentColor: this.form.controls.accentColor.value,
      backgroundColor: this.form.controls.backgroundColor.value,
    };
    this.themePreview.set(colors);
    this.selectedPresetId.set(matchThemePreset(colors)?.id ?? null);
  }

  selectPreset(preset: CompanyThemePreset): void {
    this.form.patchValue({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
    });
  }

  /** Free-typed hex: force a leading `#`, keep only hex digits, uppercase, cap at `#RRGGBB`. */
  onHexInput(field: ThemeColorField, event: Event): void {
    this.form.controls[field].setValue(normalizeHexInput((event.target as HTMLInputElement).value));
  }

  /** Native colour picker always yields `#rrggbb`; store it uppercased. */
  onColorPick(field: ThemeColorField, event: Event): void {
    this.form.controls[field].setValue((event.target as HTMLInputElement).value.toUpperCase());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.show('Revisa los campos obligatorios marcados antes de guardar.', 'error');
      return;
    }
    const value = this.form.getRawValue();
    const review = this.isEdit ? this.changesReview(value) : this.creationReview(value);
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, { data: review })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.persist(value));
  }

  /** `mod-confirmar-empresa`: resumen de la empresa antes de aprovisionarla. */
  private creationReview(value: CompanyFormValue): ReviewDialogData {
    return {
      title: 'Confirmar creación de empresa',
      icon: 'domain_add',
      intro: 'Verifique los datos principales antes de crear la empresa:',
      meta: [
        { label: 'Empresa', value: value.tradeName.trim() },
        { label: 'RUC', value: value.taxId.trim() },
        { label: 'Plan', value: this.planName(value.planId) },
        { label: 'Vigencia', value: `${value.startDate} — ${value.endDate}` },
        { label: 'Administrador', value: `${value.adminFirstName.trim()} ${value.adminLastName.trim()}` },
        { label: 'Correo del administrador', value: value.adminEmail.trim() },
      ],
      banner: {
        tone: 'info',
        text: 'Al confirmar se creará la cuenta del administrador. Sus credenciales se mostrarán una sola vez.',
      },
      confirmLabel: 'Crear empresa',
    };
  }

  /** MOD-SA-08: tabla Campo / Antes / Después con solo los campos modificados. */
  private changesReview(value: CompanyFormValue): ReviewDialogData {
    const fields: readonly DiffField<CompanyFormValue>[] = [
      { key: 'tradeName', label: 'Nombre comercial' },
      { key: 'legalName', label: 'Razón social' },
      { key: 'businessType', label: 'Rubro' },
      { key: 'companyEmail', label: 'Email' },
      { key: 'companyPhone', label: 'Teléfono' },
      { key: 'legalAddress', label: 'Dirección fiscal' },
      { key: 'internalNotes', label: 'Observaciones internas' },
      { key: 'adminFirstName', label: 'Nombres del administrador' },
      { key: 'adminLastName', label: 'Apellidos del administrador' },
      { key: 'adminPhone', label: 'Teléfono del administrador' },
      { key: 'adminDocument', label: 'Documento del administrador' },
      { key: 'planId', label: 'Plan', format: (id) => this.planName(String(id)) },
      { key: 'contractedPrice', label: 'Precio', format: formatSoles },
      { key: 'startDate', label: 'Inicio de vigencia' },
      { key: 'endDate', label: 'Fin de vigencia' },
      { key: 'firstStoreName', label: 'Local principal' },
      { key: 'primaryColor', label: 'Color primario' },
      { key: 'secondaryColor', label: 'Color secundario' },
      { key: 'backgroundColor', label: 'Color de fondo' },
    ];
    return {
      title: 'Resumen de cambios',
      code: 'MOD-SA-08',
      icon: 'difference',
      intro: 'Verifique los campos modificados antes de proceder con el guardado definitivo:',
      diff: { rows: buildDiffRows(this.initialValue ?? value, value, fields) },
      confirmLabel: 'Confirmar cambios',
    };
  }

  private planName(planId: string): string {
    return this.plans().find((plan) => plan.id === planId)?.name ?? '—';
  }

  private persist(value: CompanyFormValue): void {
    this.saving.set(true);

    if (this.isEdit) {
      this.api.update(this.existing!.id, {
        tradeName: value.tradeName.trim(),
        legalName: value.legalName.trim(),
        businessType: value.businessType.trim() || null,
        phone: value.companyPhone.trim() || null,
        email: value.companyEmail.trim(),
        address: value.legalAddress.trim(),
        internalNotes: value.internalNotes.trim() || null,
        adminFirstName: value.adminFirstName.trim(),
        adminLastName: value.adminLastName.trim(),
        adminPhone: value.adminPhone.trim() || null,
        adminDocument: value.adminDocument.trim() || null,
        planId: value.planId,
        contractedPrice: value.contractedPrice,
        startDate: value.startDate,
        endDate: value.endDate,
        primaryColor: value.primaryColor,
        secondaryColor: value.secondaryColor,
        accentColor: value.accentColor,
        backgroundColor: value.backgroundColor,
        firstStoreName: value.firstStoreName.trim() || 'Local Principal',
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.show('Empresa actualizada correctamente.', 'success');
          void this.router.navigateByUrl('/app/companies');
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          this.notifications.show(this.messageFor(cause), 'error');
        },
      });
      return;
    }

    this.api
      .create({
        tradeName: value.tradeName.trim(),
        legalName: value.legalName.trim(),
        taxDocument: value.taxId.trim(),
        businessType: value.businessType.trim() || null,
        phone: value.companyPhone.trim() || null,
        email: value.companyEmail.trim(),
        address: value.legalAddress.trim(),
        internalNotes: value.internalNotes.trim() || null,
        planId: value.planId,
        contractedPrice: value.contractedPrice,
        startDate: value.startDate,
        endDate: value.endDate,
        initialStatus: value.initialStatus,
        adminFirstName: value.adminFirstName.trim(),
        adminLastName: value.adminLastName.trim(),
        adminEmail: value.adminEmail.trim(),
        adminPhone: value.adminPhone.trim() || null,
        adminDocument: value.adminDocument.trim() || null,
        adminPassword: value.adminPassword,
        primaryColor: value.primaryColor,
        secondaryColor: value.secondaryColor,
        accentColor: value.accentColor,
        backgroundColor: value.backgroundColor,
        firstStoreName: value.firstStoreName.trim() || 'Local Principal',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.show('Empresa creada correctamente.', 'success');
          // MOD-SA-07: la contraseña la definió el superadmin en el paso 2; se muestra una única vez.
          this.dialog
            .open<CredentialDialog, CredentialDialogData, void>(CredentialDialog, {
              data: {
                title: 'Credencial creada',
                code: 'MOD-SA-07',
                successMessage: 'La cuenta de administración ha sido inicializada exitosamente.',
                username: value.adminEmail.trim(),
                passwordLabel: 'Contraseña asignada',
                password: value.adminPassword,
              },
              disableClose: true,
            })
            .afterClosed()
            .subscribe(() => void this.router.navigateByUrl('/app/companies'));
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          this.notifications.show(this.messageFor(cause), 'error');
        },
      });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'Conflicto: el RUC, el correo del administrador o la contraseña no son válidos.';
      if (cause.status === 400) return 'Revisa los datos ingresados (la contraseña del administrador debe cumplir la política de seguridad).';
    }
    return `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} la empresa.`;
  }
}

type CompanyFormValue = ReturnType<CompanyFormPage['form']['getRawValue']>;

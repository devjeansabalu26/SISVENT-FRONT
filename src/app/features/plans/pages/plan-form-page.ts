import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { DiffRow, formatSoles } from '../../../shared/utils/diff-rows';
import { PlanApiService } from '../data-access/plan-api.service';
import { PlanDetail, PlanFormValue } from '../models/plan.model';

interface FeatureOption {
  readonly code: string;
  readonly name: string;
  readonly domain: string;
}

interface FeatureGroupItem {
  readonly option: FeatureOption;
  readonly index: number;
}

interface FeatureGroup {
  readonly domain: string;
  readonly items: readonly FeatureGroupItem[];
}

@Component({
  selector: 'app-plan-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './plan-form-page.html',
  styleUrl: './plan-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(PlanApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly isEdit = !!this.id;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly featureOptions = signal<readonly FeatureOption[]>([]);
  private original: PlanDetail | null = null;

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
    currentPrice: new FormControl<number | null>(0, { nonNullable: false }),
    maxAdmins: new FormControl<number | null>(1, { nonNullable: false }),
    maxSellers: new FormControl<number | null>(3, { nonNullable: false }),
    maxStores: new FormControl<number | null>(1, { nonNullable: false }),
    priceChangeReason: new FormControl('', { nonNullable: true }),
    features: new FormArray<FormControl<boolean>>([]),
  });

  get features(): FormArray<FormControl<boolean>> {
    return this.form.controls.features;
  }

  readonly featureGroups = computed<readonly FeatureGroup[]>(() => {
    const groups = new Map<string, FeatureGroupItem[]>();
    this.featureOptions().forEach((option, index) => {
      const bucket = groups.get(option.domain) ?? [];
      bucket.push({ option, index });
      groups.set(option.domain, bucket);
    });
    return [...groups.entries()].map(([domain, items]) => ({ domain, items }));
  });

  ngOnInit(): void {
    this.api.featureMatrix().subscribe((matrix) => {
      const options = matrix.rows.map((row) => ({ code: row.featureCode, name: row.featureName, domain: row.domain }));
      this.featureOptions.set(options);
      options.forEach(() => this.features.push(new FormControl(false, { nonNullable: true })));
      if (this.id) this.loadExisting(this.id);
    });
  }

  private loadExisting(id: string): void {
    this.api.get(id).subscribe({
      next: (plan) => {
        this.original = plan;
        this.form.patchValue({
          code: plan.code,
          name: plan.name,
          description: plan.description ?? '',
          isActive: plan.isActive,
          currentPrice: plan.currentPrice,
          maxAdmins: plan.limits.find((l) => l.code === 'MAX_ADMINS')?.value ?? null,
          maxSellers: plan.limits.find((l) => l.code === 'MAX_SELLERS')?.value ?? null,
          maxStores: plan.limits.find((l) => l.code === 'MAX_STORES')?.value ?? null,
        });
        const enabled = new Set(plan.features.filter((f) => f.enabled).map((f) => f.code));
        this.featureOptions().forEach((option, index) => {
          this.features.at(index).setValue(enabled.has(option.code));
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar el plan.', 'error');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const featureCodes = this.featureOptions()
      .filter((_, index) => value.features[index])
      .map((option) => option.code);

    const body: PlanFormValue = {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || null,
      currentPrice: value.currentPrice,
      isActive: value.isActive,
      maxAdmins: value.maxAdmins,
      maxSellers: value.maxSellers,
      maxStores: value.maxStores,
      featureCodes,
      priceChangeReason: value.priceChangeReason.trim() || undefined,
    };

    if (!this.original) {
      this.persist(body);
      return;
    }
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, { data: this.changesReview(this.original, body) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.persist(body));
  }

  private changesReview(original: PlanDetail, body: PlanFormValue): ReviewDialogData {
    const limit = (value: number | null, unit: string) => (value == null ? 'Ilimitado' : `${value} ${unit}`);
    const originalLimit = (code: string) => original.limits.find((row) => row.code === code)?.value ?? null;
    const candidates: readonly DiffRow[] = [
      { field: 'Nombre', before: original.name, after: body.name },
      { field: 'Precio mensual', before: formatSoles(original.currentPrice), after: formatSoles(body.currentPrice) },
      { field: 'Estado', before: original.isActive ? 'Activo' : 'Inactivo', after: body.isActive ? 'Activo' : 'Inactivo' },
      { field: 'Administradores permitidos', before: limit(originalLimit('MAX_ADMINS'), 'usuarios'), after: limit(body.maxAdmins, 'usuarios') },
      { field: 'Vendedores permitidos', before: limit(originalLimit('MAX_SELLERS'), 'usuarios'), after: limit(body.maxSellers, 'usuarios') },
      { field: 'Locales registrados', before: limit(originalLimit('MAX_STORES'), 'locales'), after: limit(body.maxStores, 'locales') },
    ];
    const names = new Map(this.featureOptions().map((option) => [option.code, option.name]));
    const before = new Set(original.features.filter((feature) => feature.enabled).map((feature) => feature.code));
    const after = new Set(body.featureCodes);
    const label = (code: string) => names.get(code) ?? code;
    return {
      title: 'Cambios de plan',
      code: 'MOD-SA-11',
      icon: 'dashboard_customize',
      diff: {
        headers: ['Métrica / límite', 'Anterior', 'Nuevo'],
        rows: candidates.filter((row) => row.before !== row.after),
      },
      chipGroups: [
        { label: 'Módulos activados', items: [...after].filter((code) => !before.has(code)).map(label), empty: 'Ninguno (sin cambios)', tone: 'success' },
        { label: 'Módulos retirados', items: [...before].filter((code) => !after.has(code)).map(label), empty: 'Ninguno (sin cambios)', tone: 'danger' },
      ],
      note: 'Este cambio aplicará de forma global e inmediata a nuevas suscripciones registradas.',
      confirmLabel: 'Guardar cambios',
    };
  }

  private persist(body: PlanFormValue): void {
    this.saving.set(true);
    const request = this.id ? this.api.update(this.id, body) : this.api.create(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.show(`Plan ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
        void this.router.navigateByUrl('/app/plans');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        const message =
          cause instanceof AppHttpError && cause.status === 409
            ? 'Conflicto: el código del plan ya existe.'
            : `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} el plan.`;
        this.notifications.show(message, 'error');
      },
    });
  }
}

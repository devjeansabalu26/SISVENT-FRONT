import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PlanApiService } from '../../../plans/data-access/plan-api.service';
import { Plan } from '../../../plans/models/plan.model';
import { CompanyApiService } from '../../data-access/company-api.service';
import { PlanChangePreview } from '../../models/company.model';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const { startDate, endDate } = group.value as { startDate?: string; endDate?: string };
  return startDate && endDate && endDate < startDate ? { endBeforeStart: true } : null;
}

function trimmedMinLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && String(control.value).trim().length < min ? { minlength: true } : null;
}

export interface PlanChangeData {
  readonly companyId: string;
  readonly companyName: string;
  readonly currentPlan: string;
}

export interface PlanChangeResult {
  readonly planId: string;
  readonly contractedPrice: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
  readonly keepStoreIds: readonly string[];
  readonly keepSellerIds: readonly string[];
}

@Component({
  selector: 'app-plan-change-dialog',
  imports: [DatePipe, MatDialogModule, ReactiveFormsModule],
  templateUrl: './plan-change-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .dialog.plan-change { width: min(960px, calc(100vw - 32px)); max-height: calc(100vh - 48px); grid-template-rows: auto minmax(0, 1fr) auto; }
    .body { display: grid; gap: 20px; min-height: 0; overflow-y: auto; padding-right: 4px; }
    .block { display: grid; gap: 12px; }
    .block > h3 { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .block > p { color: var(--color-text-muted); font-size: var(--font-size-sm); }
    .impact { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .card { display: grid; align-content: start; gap: 10px; padding: 14px; border: 1px solid var(--control-border); border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .card.warn { border-color: color-mix(in srgb, var(--color-warning) 45%, transparent); background: color-mix(in srgb, var(--color-warning) 7%, transparent); }
    .card.full { grid-column: 1 / -1; }
    .card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .card-head h4 { display: flex; align-items: center; gap: 6px; margin: 0; font-size: var(--font-size-sm); color: var(--color-text-primary); }
    .card-head h4 .material-icons { font-size: 18px; color: var(--color-primary); }
    .counter { padding: 2px 8px; border-radius: 999px; font-size: var(--font-size-xs, 12px); font-weight: 600; color: var(--color-text-secondary); background: var(--control-bg); border: 1px solid var(--control-border); }
    .counter.ok { color: var(--color-primary); border-color: var(--color-primary); }
    .card p { margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .choices { display: grid; gap: 4px; max-height: 240px; overflow-y: auto; }
    .choice { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm, 6px); background: var(--control-bg); font-weight: 500; color: var(--color-text-primary); cursor: pointer; }
    .choice.selected { outline: 1px solid var(--color-primary); }
    .choice.disabled { opacity: 0.55; cursor: not-allowed; }
    .choice span { display: grid; gap: 2px; min-width: 0; }
    .choice strong, .choice small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .choice small { color: var(--color-text-muted); font-weight: 400; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { padding: 4px 10px; border-radius: 999px; font-size: var(--font-size-sm); color: var(--color-warning-text); background: color-mix(in srgb, var(--color-warning) 14%, transparent); }
    .summary { display: flex; gap: 8px; align-items: flex-start; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-primary-soft); color: var(--color-text-primary); font-size: var(--font-size-sm); }
    .summary .material-icons { font-size: 18px; color: var(--color-primary); }
    .summary.cash { background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
    .summary.cash .material-icons { color: var(--color-warning-text); }
    .summary ul { margin: 4px 0 0; padding-left: 18px; }
    .cash-tag { display: inline-flex; align-items: center; gap: 4px; color: var(--color-warning-text); font-weight: 600; }
    .cash-tag .material-icons { font-size: 14px; }
    @media (max-width: 720px) {
      .fields.two, .impact { grid-template-columns: minmax(0, 1fr); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanChangeDialog implements OnInit {
  readonly data = inject<PlanChangeData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanChangeDialog, PlanChangeResult | undefined>);
  private readonly planApi = inject(PlanApiService);
  private readonly companyApi = inject(CompanyApiService);

  readonly plans = signal<readonly Plan[]>([]);
  readonly preview = signal<PlanChangePreview | null>(null);
  readonly loadingPreview = signal(false);
  readonly previewFailed = signal(false);
  readonly keepStores = signal<ReadonlySet<string>>(new Set());
  readonly keepSellers = signal<ReadonlySet<string>>(new Set());

  readonly storesOver = computed(() => {
    const p = this.preview();
    return !!p && !p.samePlan && p.maxStores != null && p.stores.length > p.maxStores;
  });

  readonly removedStores = computed(() => {
    const p = this.preview();
    if (!p || !this.storesOver()) return [];
    const keep = this.keepStores();
    return p.stores.filter((s) => !keep.has(s.id));
  });

  readonly removedWithOpenCash = computed(() => this.removedStores().filter((s) => !!s.openCashSince));

  readonly unassignedUserCount = computed(() => this.removedStores().reduce((total, s) => total + s.userCount, 0));

  readonly storeSelectionValid = computed(() => {
    const p = this.preview();
    if (!p || !this.storesOver() || p.maxStores == null) return true;
    const count = this.keepStores().size;
    return count <= p.maxStores && (p.maxStores === 0 || count > 0);
  });

  readonly sellersOver = computed(() => {
    const p = this.preview();
    return !!p && !p.samePlan && p.maxSellers != null && p.sellers.length > p.maxSellers;
  });

  readonly sellerSelectionValid = computed(() => {
    const p = this.preview();
    if (!p || !this.sellersOver() || p.maxSellers == null) return true;
    const count = this.keepSellers().size;
    return count <= p.maxSellers && (p.maxSellers === 0 || count > 0);
  });

  readonly deactivatedSellerCount = computed(() =>
    this.sellersOver() ? (this.preview()?.sellers.length ?? 0) - this.keepSellers().size : 0,
  );

  readonly lostFeatures = computed(() => {
    const p = this.preview();
    return p && !p.samePlan ? p.lostFeatures : [];
  });

  readonly hasImpact = computed(() => this.storesOver() || this.sellersOver() || this.lostFeatures().length > 0);

  readonly selectionValid = computed(
    () => !this.loadingPreview() && !!this.preview() && this.storeSelectionValid() && this.sellerSelectionValid(),
  );

  readonly form = new FormGroup(
    {
      planId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      contractedPrice: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0), Validators.max(99999999.99)],
      }),
      startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      reason: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, trimmedMinLength(5), Validators.maxLength(500)],
      }),
    },
    { validators: endAfterStart },
  );

  showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    const touched = control.touched || control.dirty;
    if (name === 'endDate' && touched && this.form.hasError('endBeforeStart')) return true;
    return touched && control.invalid;
  }

  ngOnInit(): void {
    this.planApi.list().subscribe((plans) => {
      this.plans.set(plans);
      const first = plans[0];
      if (first) {
        this.form.controls.planId.setValue(first.id);
        this.form.controls.contractedPrice.setValue(first.currentPrice ?? 0);
      }
    });
    this.form.controls.planId.valueChanges.subscribe((id) => {
      const plan = this.plans().find((p) => p.id === id);
      if (plan?.currentPrice != null) this.form.controls.contractedPrice.setValue(plan.currentPrice);
      this.loadPreview(id);
    });
  }

  private loadPreview(planId: string): void {
    this.preview.set(null);
    this.previewFailed.set(false);
    this.keepStores.set(new Set());
    this.keepSellers.set(new Set());
    if (!planId) return;
    this.loadingPreview.set(true);
    this.companyApi.getPlanChangePreview(this.data.companyId, planId).subscribe({
      next: (preview) => {
        if (this.form.controls.planId.value !== planId) return;
        this.preview.set(preview);
        this.loadingPreview.set(false);
      },
      error: () => {
        if (this.form.controls.planId.value !== planId) return;
        this.loadingPreview.set(false);
        this.previewFailed.set(true);
      },
    });
  }

  retryPreview(): void {
    this.loadPreview(this.form.controls.planId.value);
  }

  toggleStore(id: string, checked: boolean): void {
    this.keepStores.update((set) => {
      const next = new Set(set);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  toggleSeller(id: string, checked: boolean): void {
    this.keepSellers.update((set) => {
      const next = new Set(set);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  storeLocked(id: string): boolean {
    const max = this.preview()?.maxStores;
    return max != null && !this.keepStores().has(id) && this.keepStores().size >= max;
  }

  sellerLocked(id: string): boolean {
    const max = this.preview()?.maxSellers;
    return max != null && !this.keepSellers().has(id) && this.keepSellers().size >= max;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectionValid()) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      contractedPrice: value.contractedPrice ?? 0,
      reason: value.reason.trim(),
      keepStoreIds: this.storesOver() ? [...this.keepStores()] : [],
      keepSellerIds: this.sellersOver() ? [...this.keepSellers()] : [],
    });
  }
}

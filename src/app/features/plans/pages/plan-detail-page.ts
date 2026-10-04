import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { groupFeaturesByDomain } from '../../../shared/utils/group-features';
import { friendlyAction } from '../../../shared/utils/audit-labels';
import { PlanCompaniesTab } from '../components/plan-companies-tab/plan-companies-tab';
import { PlanApiService } from '../data-access/plan-api.service';
import { PlanDetail, PlanFormValue } from '../models/plan.model';

type PlanTab = 'general' | 'features' | 'companies' | 'history';
const VALID_TABS: readonly PlanTab[] = ['general', 'features', 'companies', 'history'];

@Component({
  selector: 'app-plan-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, DatePipe, PlanCompaniesTab],
  templateUrl: './plan-detail-page.html',
  styleUrl: '../../../shared/ui/detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDetailPage implements OnInit {
  private readonly api = inject(PlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly plan = signal<PlanDetail | null>(null);

  private readonly initialTab = ((): PlanTab => {
    const fromUrl = this.route.snapshot.queryParamMap.get('tab');
    return (VALID_TABS as readonly string[]).includes(fromUrl ?? '') ? (fromUrl as PlanTab) : 'general';
  })();
  readonly activeTab = signal<PlanTab>(this.initialTab);
  readonly activatedTabs = signal<ReadonlySet<PlanTab>>(new Set([this.initialTab]));

  readonly featuresByDomain = computed(() => groupFeaturesByDomain(this.plan()?.features ?? []));
  readonly friendlyAction = friendlyAction;

  setTab(tab: PlanTab): void {
    this.activeTab.set(tab);
    if (!this.activatedTabs().has(tab)) this.activatedTabs.set(new Set([...this.activatedTabs(), tab]));
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  toggleStatus(): void {
    const plan = this.plan();
    if (!plan) return;
    const deactivate = plan.isActive;
    const data: ReviewDialogData = {
      title: 'Cambiar estado de plan',
      code: 'MOD-SA-10',
      icon: 'toggle_on',
      meta: [{ label: 'Plan seleccionado', value: `Plan ${plan.name}` }],
      transition: {
        fromLabel: 'Anterior',
        from: plan.isActive ? 'Activo' : 'Inactivo',
        toLabel: 'Nuevo',
        to: deactivate ? 'Inactivo' : 'Activo',
      },
      note: `Impacto: ${plan.companyCount} empresa(s) usan este plan actualmente.`,
      banner: deactivate
        ? {
            tone: 'danger',
            text: 'Las empresas existentes mantendrán el plan, pero no se podrán crear nuevas suscripciones bajo esta tarifa.',
          }
        : { tone: 'info', text: 'El plan volverá a estar disponible para nuevas suscripciones.' },
      confirmLabel: deactivate ? 'Desactivar plan' : 'Activar plan',
      destructive: deactivate,
    };
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, { data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.update(plan.id, this.toFormValue(plan, !deactivate)).subscribe({
          next: (updated) => {
            this.plan.set(updated);
            this.notifications.show(`Plan ${deactivate ? 'desactivado' : 'activado'}.`, 'success');
          },
          error: () => this.notifications.show('No se pudo cambiar el estado del plan.', 'error'),
        });
      });
  }

  private toFormValue(plan: PlanDetail, isActive: boolean): PlanFormValue {
    const limit = (code: string) => plan.limits.find((row) => row.code === code)?.value ?? null;
    return {
      code: plan.code,
      name: plan.name,
      description: plan.description,
      currentPrice: plan.currentPrice,
      isActive,
      maxAdmins: limit('MAX_ADMINS'),
      maxSellers: limit('MAX_SELLERS'),
      maxStores: limit('MAX_STORES'),
      featureCodes: plan.features.filter((feature) => feature.enabled).map((feature) => feature.code),
    };
  }

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

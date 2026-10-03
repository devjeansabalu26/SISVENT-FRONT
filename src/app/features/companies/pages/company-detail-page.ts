import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { formatDate } from '../../../shared/utils/date-format';
import { PlanChangeDialog, PlanChangeResult } from '../components/plan-change-dialog/plan-change-dialog';
import { ResetAccessDialog } from '../components/reset-access-dialog/reset-access-dialog';
import {
  ValidityChangeData,
  ValidityChangeDialog,
  ValidityChangeResult,
} from '../components/validity-change-dialog/validity-change-dialog';
import { CompanyHistoryTab } from '../components/company-history-tab/company-history-tab';
import { CompanyPlanTab } from '../components/company-plan-tab/company-plan-tab';
import { CompanyModulesTab } from '../components/company-modules-tab/company-modules-tab';
import { CompanyStoresTab } from '../components/company-stores-tab/company-stores-tab';
import { CompanySummaryTab } from '../components/company-summary-tab/company-summary-tab';
import { CompanyUsersTab } from '../components/company-users-tab/company-users-tab';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { DateTimePipe, ShortDatePipe } from '../../../shared/pipes/date-time.pipe';
import { groupFeaturesByDomain } from '../../../shared/utils/group-features';
import { PlatformUserApiService } from '../../users/data-access/platform-user-api.service';
import { CompanyApiService } from '../data-access/company-api.service';
import { CompanyDetail } from '../models/company.model';

type CompanyTab = 'general' | 'plan' | 'modules' | 'users' | 'stores' | 'summary' | 'history';
const VALID_TABS: readonly CompanyTab[] = ['general', 'plan', 'modules', 'users', 'stores', 'summary', 'history'];

@Component({
  selector: 'app-company-detail-page',
  imports: [
    PageHeader,
    StatusChip,
    KpiCard,
    RouterLink,
    DateTimePipe,
    ShortDatePipe,
    CompanyPlanTab,
    CompanyModulesTab,
    CompanyUsersTab,
    CompanyStoresTab,
    CompanySummaryTab,
    CompanyHistoryTab,
  ],
  templateUrl: './company-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(CompanyApiService);
  private readonly platformUserApi = inject(PlatformUserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly company = signal<CompanyDetail | null>(null);

  private readonly initialTab = ((): CompanyTab => {
    const fromUrl = this.route.snapshot.queryParamMap.get('tab');
    return (VALID_TABS as readonly string[]).includes(fromUrl ?? '') ? (fromUrl as CompanyTab) : 'general';
  })();
  readonly activeTab = signal<CompanyTab>(this.initialTab);
  // Lazy loading por tab: un tab solo monta su componente (y por lo tanto pide datos) la primera vez que
  // se abre; luego queda montado y oculto con [hidden] para conservar su estado al volver a él.
  readonly activatedTabs = signal<ReadonlySet<CompanyTab>>(new Set([this.initialTab]));

  readonly permissionGroups = computed(() => groupFeaturesByDomain(this.company()?.planFeatures ?? []));

  setTab(tab: CompanyTab): void {
    this.activeTab.set(tab);
    if (!this.activatedTabs().has(tab)) this.activatedTabs.set(new Set([...this.activatedTabs(), tab]));
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** Un tab ya montado no vuelve a pedir datos por su cuenta: tras una acción que cambia lo que muestra
   * (cambiar plan, suspender), lo desmontamos para que la próxima vez que se abra pida datos frescos. No
   * afecta al tab en el que el usuario está parado en ese momento (evita que la pantalla parpadee). */
  private invalidateTabs(tabs: readonly CompanyTab[]): void {
    const current = this.activeTab();
    const next = new Set(this.activatedTabs());
    for (const tab of tabs) if (tab !== current) next.delete(tab);
    this.activatedTabs.set(next);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.get(this.id).subscribe({
      next: (company) => {
        this.company.set(company);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** `mod-suspender-empresa` / MOD-SA-02 `mod-reactivar-empresa`: transición de estado con motivo obligatorio. */
  suspend(): void {
    const company = this.company();
    if (!company) return;
    const isSuspended = company.status === 'SUSPENDED';
    const vigencia =
      company.planStart && company.planEnd ? `${formatDate(company.planStart)} — ${formatDate(company.planEnd)}` : 'Sin plan vigente';
    const data: ReviewDialogData = isSuspended
      ? {
          title: 'Reactivar empresa',
          code: 'MOD-SA-02',
          icon: 'check_circle',
          meta: [
            { label: 'Empresa', value: company.tradeName },
            { label: 'Vigencia de contrato', value: vigencia },
          ],
          transition: { fromLabel: 'Estado actual', from: 'Suspendida', toLabel: 'Estado resultante', to: 'Activa' },
          banner: { tone: 'info', text: 'Los usuarios podrán acceder nuevamente al sistema de inmediato.' },
          reason: { label: 'Motivo de la reactivación', placeholder: 'Pago regularizado, solicitud del cliente…' },
          confirmLabel: 'Reactivar empresa',
        }
      : {
          title: 'Suspender empresa',
          icon: 'block',
          meta: [
            { label: 'Empresa', value: company.tradeName },
            { label: 'Usuarios afectados', value: `${company.userCount} usuario(s)` },
          ],
          transition: { fromLabel: 'Estado actual', from: 'Activa', toLabel: 'Estado resultante', to: 'Suspendida' },
          banner: { tone: 'danger', text: 'Los usuarios asociados no podrán acceder al sistema mientras la empresa esté suspendida.' },
          reason: { label: 'Motivo de la suspensión', placeholder: 'Falta de pago, solicitud del cliente…' },
          confirmLabel: 'Suspender empresa',
          destructive: true,
        };
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean | string>(ReviewDialog, { data })
      .afterClosed()
      .pipe(filter((reason): reason is string => typeof reason === 'string'))
      .subscribe((reason) => {
        const request = isSuspended ? this.api.activate(company.id, reason) : this.api.suspend(company.id, reason);
        request.subscribe({
          next: () => {
            this.notifications.show(`Empresa ${isSuspended ? 'reactivada' : 'suspendida'}.`, 'success');
            this.load();
            this.invalidateTabs(['summary']);
          },
          error: () => this.notifications.show('No se pudo actualizar el estado de la empresa.', 'error'),
        });
      });
  }

  changePlan(): void {
    const company = this.company();
    if (!company) return;
    this.dialog
      .open(PlanChangeDialog, { data: { companyName: company.tradeName, currentPlan: company.planName ?? 'Sin plan' } })
      .afterClosed()
      .pipe(filter((result): result is PlanChangeResult => !!result))
      .subscribe((result) => {
        this.api
          .changePlan(company.id, {
            planId: result.planId,
            contractedPrice: result.contractedPrice,
            startDate: result.startDate,
            endDate: result.endDate,
            reason: result.reason,
          })
          .subscribe({
            next: () => {
              this.notifications.show('Plan actualizado correctamente.', 'success');
              this.load();
              this.invalidateTabs(['plan', 'summary']);
            },
            error: () => this.notifications.show('No se pudo cambiar el plan.', 'error'),
          });
      });
  }

  /** MOD-SA-03: extiende/reduce la vigencia reutilizando `change-plan` con el mismo plan y precio (queda auditado). */
  changeValidity(): void {
    const company = this.company();
    if (!company?.planId || !company.planEnd) return;
    const { planId, planEnd } = company;
    this.dialog
      .open<ValidityChangeDialog, ValidityChangeData, ValidityChangeResult>(ValidityChangeDialog, {
        data: { companyName: company.tradeName, currentEnd: planEnd },
      })
      .afterClosed()
      .pipe(filter((result): result is ValidityChangeResult => !!result))
      .subscribe((result) => {
        this.api
          .changePlan(company.id, {
            planId,
            contractedPrice: company.contractedPrice ?? 0,
            startDate: company.planStart ?? planEnd,
            endDate: result.endDate,
            reason: result.reason,
          })
          .subscribe({
            next: () => {
              this.notifications.show('Vigencia actualizada correctamente.', 'success');
              this.load();
              this.invalidateTabs(['plan', 'summary', 'history']);
            },
            error: () => this.notifications.show('No se pudo cambiar la vigencia.', 'error'),
          });
      });
  }

  resetAccess(): void {
    const company = this.company();
    if (!company) return;
    this.platformUserApi.list({ companyId: company.id, role: 'ADMIN' }).subscribe({
      next: (page) => {
        const admin = page.items[0];
        if (!admin) {
          this.notifications.show('No se encontró un administrador activo para esta empresa.', 'error');
          return;
        }
        this.dialog
          .open(ResetAccessDialog, { data: { profileId: admin.profileId, username: admin.email ?? admin.fullName, companyName: company.tradeName } })
          .afterClosed()
          .pipe(filter(Boolean))
          .subscribe(() => this.load());
      },
      error: () => this.notifications.show('No se pudo obtener el administrador de la empresa.', 'error'),
    });
  }
}

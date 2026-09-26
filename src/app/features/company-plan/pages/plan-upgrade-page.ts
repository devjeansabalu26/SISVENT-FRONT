import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PLAN_FEATURE_LABELS } from '../../../core/auth/constants/plan-features.constant';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyPlanApiService } from '../data-access/company-plan-api.service';
import { AvailablePlan, MyPlan } from '../models/company-plan.model';

/**
 * Módulo que el plan vigente no incluye (menú con candado o URL directa). Explica qué planes lo incluyen
 * y lleva a "Mi plan" para solicitar el cambio. El VENDEDOR no consulta el plan: se le pide avisar al ADMIN.
 */
@Component({
  selector: 'app-plan-upgrade-page',
  imports: [RouterLink],
  template: `
    <section class="upgrade">
      <span class="upgrade__icon material-icons" aria-hidden="true">lock</span>
      <h1>{{ moduleName() }} no está incluido en tu plan</h1>

      @if (isAdmin) {
        @if (currentPlanName(); as current) {
          <p>Tu empresa tiene el plan <strong>{{ current }}</strong>.</p>
        }
        @if (plansWithFeature().length) {
          <p>Está disponible en:</p>
          <ul class="plans">
            @for (plan of plansWithFeature(); track plan.id) {
              <li><strong>{{ plan.name }}</strong><span>{{ price(plan) }}</span></li>
            }
          </ul>
        } @else if (!loading()) {
          <p>Consulta con el equipo de SISVENT qué plan incluye este módulo.</p>
        }
        <div class="actions">
          <a class="primary" routerLink="/app/plan"><span class="material-icons">workspace_premium</span>Ver planes y solicitar cambio</a>
          <a class="ghost" routerLink="/app/dashboard">Volver al inicio</a>
        </div>
      } @else {
        <p>Pide a tu administrador que actualice el plan de la empresa para usar este módulo.</p>
        <div class="actions">
          <a class="ghost" routerLink="/app/dashboard">Volver al inicio</a>
        </div>
      }
    </section>
  `,
  styles: `
    .upgrade {
      display: grid; justify-items: center; gap: 12px; max-width: 560px; margin: 40px auto; padding: 32px 24px;
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); text-align: center;
    }
    .upgrade__icon {
      display: grid; place-items: center; width: 64px; height: 64px; border-radius: var(--radius-full);
      font-size: 32px; color: var(--color-primary); background: var(--color-primary-soft);
    }
    h1 { margin: 4px 0 0; font-size: 20px; }
    p { margin: 0; color: var(--color-text-secondary); }
    .plans { display: grid; gap: 8px; width: 100%; margin: 4px 0 0; padding: 0; list-style: none; }
    .plans li {
      display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px;
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
    }
    .plans span { color: var(--color-text-muted); }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
    .actions a {
      display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: var(--radius-md);
      font-weight: 600; text-decoration: none;
    }
    .actions .material-icons { font-size: 18px; }
    .primary { color: var(--color-on-primary, white); background: var(--color-primary); }
    .ghost { border: 1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanUpgradePage implements OnInit {
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly api = inject(CompanyPlanApiService);
  readonly isAdmin = inject(UserContextService).user()?.role === 'ADMIN';

  private readonly feature = this.params.get('feature') ?? '';
  readonly moduleName = signal(this.params.get('module') || PLAN_FEATURE_LABELS[this.feature] || 'Este módulo');
  readonly loading = signal(this.isAdmin);
  private readonly plan = signal<MyPlan | null>(null);

  readonly currentPlanName = computed(() => this.plan()?.current?.name ?? null);
  readonly plansWithFeature = computed(() =>
    (this.plan()?.plans ?? []).filter((plan) => !plan.isCurrent && (plan.featureCodes ?? []).includes(this.feature)),
  );

  ngOnInit(): void {
    if (!this.isAdmin) return;
    this.api.get().subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  price(plan: AvailablePlan): string {
    return plan.price === null ? 'Precio a consultar' : `S/ ${plan.price.toFixed(2)} / mes`;
  }
}

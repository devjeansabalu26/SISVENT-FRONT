import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DateTimePipe, ShortDatePipe } from '../../../../shared/pipes/date-time.pipe';
import { StatusChip } from '../../../../shared/ui/status-chip/status-chip';
import { groupFeaturesByDomain } from '../../../../shared/utils/group-features';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyPlan } from '../../models/company.model';

/** Etiquetas amigables para los limit_code conocidos; uno no listado muestra su descripción o el código tal cual. */
const LIMIT_LABELS: Record<string, string> = {
  MAX_ADMINS: 'Administradores máximos',
  MAX_SELLERS: 'Vendedores máximos',
  MAX_STORES: 'Locales máximos',
  MAX_PRODUCTS: 'Productos máximos',
};

@Component({
  selector: 'app-company-plan-tab',
  imports: [StatusChip, DateTimePipe, ShortDatePipe],
  templateUrl: './company-plan-tab.html',
  styleUrls: ['../../../../shared/ui/detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPlanTab implements OnInit {
  private readonly api = inject(CompanyApiService);

  readonly companyId = input.required<string>();

  readonly loading = signal(true);
  readonly plan = signal<CompanyPlan | null>(null);

  readonly featureGroups = computed(() => groupFeaturesByDomain(this.plan()?.features ?? []));

  ngOnInit(): void {
    this.api.getPlan(this.companyId()).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  limitLabel(code: string, description: string | null): string {
    return LIMIT_LABELS[code] ?? description ?? code;
  }
}

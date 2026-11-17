import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessControlService } from '../../../../core/auth/services/access-control.service';
import { MoneyPipe, QuantityPipe } from '../../../../shared/pipes/date-time.pipe';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { ReportState } from '../../data-access/report-state';
import { SalesReportApiService } from '../../data-access/sales-report-api.service';
import { HealthReport } from '../../models/health-report.model';
import { ReportPeriod, periodRange } from '../../utils/report-period';
import { healthInsights } from '../../utils/health-insights';

const LINK_FEATURES: Readonly<Record<string, string>> = {
  '/app/reports/products': 'REPORTS_PRODUCTS',
  '/app/reports/sales': 'REPORTS_SALES',
  '/app/reports/team': 'REPORTS_TEAM',
  '/app/products': 'PRODUCTS',
};

@Component({
  selector: 'app-health-panel',
  imports: [RouterLink, KpiCard, MoneyPipe, QuantityPipe],
  templateUrl: './health-panel.html',
  styleUrl: './health-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthPanel {
  private readonly api = inject(SalesReportApiService);
  private readonly access = inject(AccessControlService);
  private readonly state = inject(ReportState);
  private requestId = 0;

  readonly health = signal<HealthReport | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);

  readonly insights = computed(() => {
    const report = this.health();
    if (!report) return [];
    return healthInsights(report).map((item) =>
      item.link && LINK_FEATURES[item.link] && !this.access.hasFeature(LINK_FEATURES[item.link]) ? { ...item, link: undefined } : item,
    );
  });

  readonly monthProgress = computed(() => {
    const month = this.health()?.month;
    if (!month || month.previousMonth <= 0) return null;
    return Math.min(100, Math.round((month.monthToDate / month.previousMonth) * 100));
  });

  constructor() {
    effect(() => {
      const period = this.state.period();
      const storeId = this.state.storeId();
      untracked(() => this.load(period, storeId));
    });
  }

  reload(): void {
    this.load(this.state.period(), this.state.storeId());
  }

  marginText(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1)}%`;
  }

  deltaText(value: number | null): string | undefined {
    return value === null ? undefined : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  trendOf(value: number | null): 'up' | 'down' | 'flat' {
    if (value === null || value === 0) return 'flat';
    return value > 0 ? 'up' : 'down';
  }

  private load(period: ReportPeriod, storeId: string): void {
    const requestId = ++this.requestId;
    const range = periodRange(period);
    this.loading.set(true);
    this.failed.set(false);
    this.api.health({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined }).subscribe({
      next: (report) => {
        if (requestId !== this.requestId) return;
        this.health.set(report);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.requestId) return;
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}

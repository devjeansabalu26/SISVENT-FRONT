import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { formatMoney } from '../../../../core/regional/regional-format';
import { CompanyRegional as RegionalFormat, PERU_REGIONAL } from '../../../../core/regional/regional.model';
import { CountryApiService } from '../../../countries/data-access/country-api.service';
import { DateTimePipe, ShortDatePipe } from '../../../../shared/pipes/date-time.pipe';
import { StatusChip } from '../../../../shared/ui/status-chip/status-chip';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { friendlyAction, friendlyEntity } from '../../../../shared/utils/audit-labels';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyOverview } from '../../models/company.model';

@Component({
  selector: 'app-company-summary-tab',
  imports: [KpiCard, StatusChip, DateTimePipe, ShortDatePipe],
  templateUrl: './company-summary-tab.html',
  styleUrls: ['../../../../shared/ui/detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanySummaryTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly countries = inject(CountryApiService);
  private readonly format = signal<RegionalFormat>(PERU_REGIONAL);
  readonly salesAmount = computed(() => formatMoney(this.overview()?.salesAmount ?? 0, this.format()));

  readonly companyId = input.required<string>();

  readonly loading = signal(true);
  readonly overview = signal<CompanyOverview | null>(null);

  readonly friendlyAction = friendlyAction;
  readonly friendlyEntity = friendlyEntity;

  ngOnInit(): void {
    this.api.getOverview(this.companyId()).subscribe({
      next: (result) => {
        this.overview.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    forkJoin([this.countries.companyRegional(this.companyId()), this.countries.currencies()]).subscribe({
      next: ([regional, currencies]) => {
        const currency = currencies.find((item) => item.code === regional.currencyCode);
        this.format.set({
          ...PERU_REGIONAL,
          currencyCode: regional.currencyCode,
          currencySymbol: currency?.symbol ?? regional.currencyCode,
          currencyDecimals: currency?.decimals ?? 2,
          locale: regional.locale,
        });
      },
    });
  }
}

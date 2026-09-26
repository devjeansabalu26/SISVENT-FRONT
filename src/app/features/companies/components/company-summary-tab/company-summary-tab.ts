import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
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
  }
}

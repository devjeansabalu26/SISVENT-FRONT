import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyStores } from '../../models/company.model';

@Component({
  selector: 'app-company-stores-tab',
  imports: [KpiCard, DateTimePipe],
  templateUrl: './company-stores-tab.html',
  styleUrls: ['../../../../shared/ui/detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyStoresTab implements OnInit {
  private readonly api = inject(CompanyApiService);

  readonly companyId = input.required<string>();

  readonly loading = signal(true);
  readonly stores = signal<CompanyStores | null>(null);

  ngOnInit(): void {
    this.api.getStores(this.companyId()).subscribe({
      next: (result) => {
        this.stores.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

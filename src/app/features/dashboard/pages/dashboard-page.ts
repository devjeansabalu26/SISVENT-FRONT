import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { KpiCard, KpiTrend } from '../../../shared/ui/kpi-card/kpi-card';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DateRangePreset, DATE_RANGE_PRESET_LABEL, resolveDateRange } from '../../../shared/utils/date-range-presets';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { UserApiService } from '../../users/data-access/user-api.service';
import { DashboardApiService } from '../data-access/dashboard-api.service';
import {
  AdminDashboard,
  DashboardHourPoint,
  PlatformDashboardResponse,
  SellerDashboard,
} from '../models/dashboard.model';

import { StoresTodayPanel } from '../components/stores-today/stores-today';
import { CompactMoneyPipe, DateTimePipe, LocalTimePipe, MoneyPipe, ShortDatePipe } from '../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-dashboard-page',
  imports: [PageHeader, KpiCard, StatusChip, RouterLink, StoresTodayPanel, MoneyPipe, CompactMoneyPipe, DateTimePipe, ShortDatePipe, LocalTimePipe],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly sellerApi = inject(UserApiService);
  private readonly userContext = inject(UserContextService);
  private readonly companyContext = inject(CompanyContextService);

  readonly role = computed(() => this.userContext.user()?.role ?? 'ADMIN');
  readonly displayName = computed(() => this.userContext.user()?.displayName ?? 'Usuario');
  readonly companyName = computed(() => this.companyContext.company()?.commercialName ?? 'tu empresa');

  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly admin = signal<AdminDashboard | null>(null);
  readonly seller = signal<SellerDashboard | null>(null);
  readonly platform = signal<PlatformDashboardResponse | null>(null);

  readonly datePreset = signal<DateRangePreset>('today');
  readonly dateRangeLabel = DATE_RANGE_PRESET_LABEL;
  readonly dateRangePresets: readonly DateRangePreset[] = ['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth'];
  readonly storeId = signal('');
  readonly sellerId = signal('');
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly sellers = signal<readonly { id: string; fullName: string }[]>([]);

  readonly comparisonCaption = computed(() => COMPARISON_CAPTION[this.datePreset()]);

  readonly hourSeries = computed(() => fillHours(this.admin()?.todayByHour ?? []));
  readonly maxHourAmount = computed(() => Math.max(...this.hourSeries().map((point) => point.amount), 1));
  readonly peakHour = computed(() =>
    this.hourSeries().reduce<DashboardHourPoint | null>((best, point) => (!best || point.amount > best.amount ? point : best), null),
  );
  readonly monthName = computed(() => {
    const start = this.admin()?.month?.monthStart;
    return start ? MONTH_NAMES[Number(start.slice(5, 7)) - 1] : '';
  });
  readonly monthVsPrevious = computed(() => {
    const month = this.admin()?.month;
    if (!month || month.previousMonthAmount <= 0) return null;
    return Math.round(((month.projectedAmount - month.previousMonthAmount) / month.previousMonthAmount) * 1000) / 10;
  });

  readonly maxSalesEvolution = computed(() =>
    Math.max(...(this.admin()?.salesEvolution.map((point) => point.amount) ?? [0]), 1),
  );
  readonly categoryTotal = computed(() =>
    (this.admin()?.salesByCategory ?? []).reduce((sum, item) => sum + item.amount, 0) || 1,
  );

  ngOnInit(): void {
    if (this.role() === 'SUPERADMIN') {
      this.api.platform().subscribe({
        next: (response) => {
          this.platform.set(response);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }
    if (this.role() === 'ADMIN') {
      this.storeApi.list().subscribe((result) => this.stores.set(result.items));
      this.loadSellers();
    }
    this.load();
  }

  private loadSellers(): void {
    this.sellerApi.list({ role: 'VENDEDOR', storeId: this.storeId() || undefined, pageSize: 100 }).subscribe((result) =>
      this.sellers.set(result.items.map((u) => ({ id: u.id, fullName: u.fullName }))),
    );
  }

  private load(syncOnly = false): void {
    if (syncOnly) this.syncing.set(true);
    else this.loading.set(true);
    if (this.role() === 'ADMIN') {
      const range = resolveDateRange(this.datePreset());
      this.api
        .get({ dateFrom: range.from, dateTo: range.to, storeId: this.storeId() || undefined, sellerId: this.sellerId() || undefined })
        .subscribe({
          next: (response) => {
            this.admin.set(response.admin);
            this.loading.set(false);
            this.syncing.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.syncing.set(false);
          },
        });
      return;
    }
    this.api.get().subscribe({
      next: (response) => {
        this.admin.set(response.admin);
        this.seller.set(response.seller);
        this.loading.set(false);
        this.syncing.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.syncing.set(false);
      },
    });
  }

  onDatePresetChange(value: string): void {
    this.datePreset.set(value as DateRangePreset);
    this.load();
  }

  onStoreChange(value: string): void {
    this.storeId.set(value);
    this.sellerId.set('');
    this.loadSellers();
    this.load();
  }

  onSellerChange(value: string): void {
    this.sellerId.set(value);
    this.load();
  }

  sync(): void {
    this.load(true);
  }

  deltaTrend(value: number | null | undefined): KpiTrend {
    if (value == null || value === 0) return 'flat';
    return value > 0 ? 'up' : 'down';
  }

  deltaText(value: number | null | undefined): string | undefined {
    if (value == null) return undefined;
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count === 1 ? singular : pluralForm}`;
  }

  hourLabel(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  stockDaysText(days: number | null | undefined): string | null {
    if (days == null) return null;
    return days < 1 ? 'menos de 1 día de stock' : `${Math.floor(days)} ${Math.floor(days) === 1 ? 'día' : 'días'} de stock`;
  }

  categoryPercent(amount: number): number {
    return Math.round((amount / this.categoryTotal()) * 1000) / 10;
  }
}

const COMPARISON_CAPTION: Readonly<Record<DateRangePreset, string>> = {
  today: 'vs ayer',
  yesterday: 'vs el día anterior',
  last7: 'vs los 7 días previos',
  thisMonth: 'vs período anterior',
  lastMonth: 'vs período anterior',
};

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fillHours(points: readonly DashboardHourPoint[]): readonly DashboardHourPoint[] {
  if (!points.length) return [];
  const byHour = new Map(points.map((point) => [point.hour, point]));
  const first = Math.min(...points.map((point) => point.hour));
  const last = Math.max(...points.map((point) => point.hour));
  const filled: DashboardHourPoint[] = [];
  for (let hour = first; hour <= last; hour++) filled.push(byHour.get(hour) ?? { hour, transactions: 0, amount: 0 });
  return filled;
}

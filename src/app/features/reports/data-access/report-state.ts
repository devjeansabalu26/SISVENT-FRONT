import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { SalesReport } from '../models/sales-report.model';
import { formatDate } from '../../../core/regional/regional-format';
import { DEFAULT_PERIOD, ReportPeriod, normalizePeriod, periodLabel, periodRange } from '../utils/report-period';
import { SalesReportApiService } from './sales-report-api.service';

const PERIOD_KEY = 'savix.reports.period';
const STORE_KEY = 'savix.reports.store';

function remembered(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

@Injectable()
export class ReportState {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SalesReportApiService);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private requestId = 0;

  topCount = 10;
  loadSales = true;

  readonly period = computed<ReportPeriod>(
    () => normalizePeriod(this.params().get('period')) ?? normalizePeriod(remembered(PERIOD_KEY)) ?? DEFAULT_PERIOD,
  );
  readonly storeId = computed(() => this.params().get('store') ?? remembered(STORE_KEY) ?? '');
  readonly viewParam = computed(() => this.params().get('view'));
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly report = signal<SalesReport | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);

  constructor() {
    inject(StoreApiService).list().subscribe({
      next: (response) => this.stores.set(response.items.filter((store) => !store.isWaste)),
      error: () => this.stores.set([]),
    });
    effect(() => {
      const period = this.period();
      const storeId = this.storeId();
      if (!this.loadSales) return;
      untracked(() => this.load(period, storeId));
    });
  }

  readonly storeName = computed(() => this.stores().find((store) => store.id === this.storeId())?.name ?? 'Todos los locales');

  exportContext(): string {
    const period = this.period();
    const range = periodRange(period);
    const to = period === 'last-month' ? new Date(range.to.getTime() - 1) : range.to;
    const from = formatDate(range.from);
    const until = formatDate(to);
    const dates = from === until ? from : `${from} al ${until}`;
    return `${periodLabel(period)} (${dates}) · ${this.storeName()}`;
  }

  setPeriod(period: ReportPeriod): void {
    remember(PERIOD_KEY, period);
    this.update({ period });
  }

  setStore(storeId: string): void {
    remember(STORE_KEY, storeId);
    this.update({ store: storeId || null });
  }

  setView(view: string): void {
    this.update({ view });
  }

  reload(): void {
    this.load(this.period(), this.storeId());
  }

  private update(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private load(period: ReportPeriod, storeId: string): void {
    const requestId = ++this.requestId;
    const range = periodRange(period);
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .get({ from: range.from.toISOString(), to: range.to.toISOString(), storeId: storeId || undefined, topCount: this.topCount })
      .subscribe({
        next: (report) => {
          if (requestId !== this.requestId) return;
          this.report.set(report);
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

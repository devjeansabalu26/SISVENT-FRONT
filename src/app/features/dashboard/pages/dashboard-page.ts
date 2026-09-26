import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DateRangePreset, DATE_RANGE_PRESET_LABEL, resolveDateRange } from '../../../shared/utils/date-range-presets';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { UserApiService } from '../../users/data-access/user-api.service';
import { DashboardApiService } from '../data-access/dashboard-api.service';
import {
  AdminDashboard,
  PlatformDashboardResponse,
  SellerDashboard,
} from '../models/dashboard.model';

@Component({
  selector: 'app-dashboard-page',
  imports: [PageHeader, KpiCard, StatusChip, RouterLink, DatePipe],
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

  // Filtros superiores del dashboard ADMIN (sección 2 del pedido). "Fecha" es un preset resuelto a
  // dateFrom/dateTo reales antes de llamar al backend; Local/Vendedor son ids reales de la empresa.
  readonly datePreset = signal<DateRangePreset>('today');
  readonly dateRangeLabel = DATE_RANGE_PRESET_LABEL;
  readonly dateRangePresets: readonly DateRangePreset[] = ['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth'];
  readonly storeId = signal('');
  readonly sellerId = signal('');
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly sellers = signal<readonly { id: string; fullName: string }[]>([]);

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
    syncOnly ? this.syncing.set(true) : this.loading.set(true);
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
    // El vendedor seleccionado puede no pertenecer al local nuevo: se limpia y se recarga la lista.
    this.sellerId.set('');
    this.loadSellers();
    this.load();
  }

  onSellerChange(value: string): void {
    this.sellerId.set(value);
    this.load();
  }

  /** Botón "Sincronizar": vuelve a pedir los datos sin recargar el navegador ni destruir el layout. */
  sync(): void {
    this.load(true);
  }

  categoryPercent(amount: number): number {
    return Math.round((amount / this.categoryTotal()) * 1000) / 10;
  }
}

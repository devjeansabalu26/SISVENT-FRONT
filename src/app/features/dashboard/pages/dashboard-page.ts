import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import {
  ADMIN_LOW_STOCK,
  ADMIN_SALES,
  ADMIN_TOP_PRODUCTS,
  SUPERADMIN_ACTIVITY,
  SUPERADMIN_COMPANIES,
  SUPERADMIN_EXPIRING,
  VENDOR_SALES,
} from '../data-access/dashboard.mock';

@Component({
  selector: 'app-dashboard-page',
  imports: [PageHeader, KpiCard, StatusChip, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly userContext = inject(UserContextService);
  private readonly companyContext = inject(CompanyContextService);

  readonly role = computed(() => this.userContext.user()?.role ?? 'ADMIN');
  readonly displayName = computed(() => this.userContext.user()?.displayName ?? 'Usuario');
  readonly companyName = computed(() => this.companyContext.company()?.commercialName ?? 'tu empresa');

  readonly superadminCompanies = SUPERADMIN_COMPANIES;
  readonly superadminExpiring = SUPERADMIN_EXPIRING;
  readonly superadminActivity = SUPERADMIN_ACTIVITY;
  readonly adminSales = ADMIN_SALES;
  readonly adminTopProducts = ADMIN_TOP_PRODUCTS;
  readonly adminLowStock = ADMIN_LOW_STOCK;
  readonly vendorSales = VENDOR_SALES;
}

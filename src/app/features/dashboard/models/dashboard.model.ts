/** Mirrors DashboardResponse from GET /api/v1/dashboard (ADMIN/VENDEDOR). */
export interface DashboardRecentSale {
  readonly saleNumber: string;
  readonly saleDate: string;
  readonly clientName: string | null;
  readonly total: number;
  readonly status: string;
}

export interface DashboardTopProduct {
  readonly sku: string;
  readonly name: string;
  readonly units: number;
  readonly revenue: number;
}

export interface DashboardLowStock {
  readonly productName: string;
  readonly storeName: string;
  readonly currentStock: number;
  readonly minStock: number;
}

export interface DashboardSalesPoint {
  readonly date: string;
  readonly amount: number;
}

export interface DashboardCategorySales {
  readonly categoryName: string;
  readonly amount: number;
}

export interface AdminDashboard {
  readonly salesTodayAmount: number;
  readonly salesTodayDeltaPercent: number | null;
  readonly salesPeriodAmount: number;
  readonly operationsPeriod: number;
  readonly activeProducts: number;
  readonly activeClients: number;
  readonly lowStockCount: number;
  readonly activeStores: number;
  readonly recentSales: readonly DashboardRecentSale[];
  readonly topProducts: readonly DashboardTopProduct[];
  readonly lowStockAlerts: readonly DashboardLowStock[];
  readonly salesEvolution: readonly DashboardSalesPoint[];
  readonly salesByCategory: readonly DashboardCategorySales[];
}

export interface SellerDashboard {
  readonly salesToday: number;
  readonly amountToday: number;
  readonly lastSaleAt: string | null;
  readonly clientsToday: number;
  readonly recentSales: readonly DashboardRecentSale[];
}

export interface DashboardResponse {
  readonly role: 'ADMIN' | 'VENDEDOR';
  readonly admin: AdminDashboard | null;
  readonly seller: SellerDashboard | null;
}

/** Mirrors PlatformDashboardResponse from GET /api/v1/platform/dashboard (SUPERADMIN). */
export interface PlatformCompanySummary {
  readonly totalCompanies: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
  readonly suspended: number;
  readonly newThisMonth: number;
  readonly activeUsers: number;
}

export interface PlatformRecentCompany {
  readonly id: string;
  readonly tradeName: string;
  readonly administratorName: string | null;
  readonly createdAt: string;
  readonly status: string;
}

export interface PlatformUpcomingExpiration {
  readonly companyId: string;
  readonly tradeName: string;
  readonly planName: string | null;
  readonly endDate: string;
  readonly daysRemaining: number;
}

export interface PlatformActivity {
  readonly at: string;
  readonly actorName: string | null;
  readonly companyName: string | null;
  readonly action: string;
  readonly entityName: string;
  readonly detail: string | null;
}

export interface PlatformDashboardResponse {
  readonly summary: PlatformCompanySummary;
  readonly recentCompanies: readonly PlatformRecentCompany[];
  readonly upcomingExpirations: readonly PlatformUpcomingExpiration[];
  readonly recentActivity: readonly PlatformActivity[];
}

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
  readonly marginPercent?: number | null;
  readonly stockDays?: number | null;
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
  readonly salesPeriodDeltaPercent?: number | null;
  readonly operationsDeltaPercent?: number | null;
  readonly averageTicket?: number;
  readonly averageTicketDeltaPercent?: number | null;
  readonly grossProfit?: number | null;
  readonly grossProfitDeltaPercent?: number | null;
  readonly grossProfitMissingCost?: boolean;
  readonly actions?: DashboardActions | null;
  readonly month?: DashboardMonthProjection | null;
  readonly todayByHour?: readonly DashboardHourPoint[] | null;
  readonly analyticsEnabled?: boolean;
}

export interface DashboardMonthProjection {
  readonly monthStart: string;
  readonly daysElapsed: number;
  readonly daysInMonth: number;
  readonly amountToDate: number;
  readonly projectedAmount: number;
  readonly previousMonthAmount: number;
}

export interface DashboardHourPoint {
  readonly hour: number;
  readonly transactions: number;
  readonly amount: number;
}

export interface DashboardActions {
  readonly reorderNow: number | null;
  readonly reorderSoon: number | null;
  readonly outOfStock: number;
  readonly ordersInTransit: number;
}

export interface SellerDashboard {
  readonly salesToday: number;
  readonly amountToday: number;
  readonly lastSaleAt: string | null;
  readonly clientsToday: number;
  readonly recentSales: readonly DashboardRecentSale[];
  readonly amountSameTimeLastWeek?: number;
  readonly amountDeltaPercent?: number | null;
  readonly lowStockCount?: number;
  readonly lowStockAlerts?: readonly DashboardLowStock[] | null;
}

export interface DashboardResponse {
  readonly role: 'ADMIN' | 'VENDEDOR';
  readonly admin: AdminDashboard | null;
  readonly seller: SellerDashboard | null;
}

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

export interface StoreTodayPerson {
  readonly fullName: string;
  readonly role: string;
  readonly checkInAt: string;
}

export interface StoreTodayCash {
  readonly openedBy: string;
  readonly openedAt: string;
  readonly expectedCash: number;
  readonly salesCount: number;
  readonly totalSales: number;
}

export interface StoreTodayAlert {
  readonly code: 'NOBODY_IN_SHIFT' | 'CASH_OPEN_UNATTENDED' | 'CASH_CLOSED_WITH_STAFF';
  readonly message: string;
}

export interface StoreTodayItem {
  readonly storeId: string;
  readonly storeName: string;
  readonly present: readonly StoreTodayPerson[];
  readonly cash: StoreTodayCash | null;
  readonly salesCount: number;
  readonly salesTotal: number;
  readonly alerts: readonly StoreTodayAlert[];
}

export interface StoresTodayResponse {
  readonly date: string;
  readonly attendanceEnabled: boolean;
  readonly stores: readonly StoreTodayItem[];
}

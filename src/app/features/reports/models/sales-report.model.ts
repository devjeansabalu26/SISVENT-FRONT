export interface MetricDelta {
  readonly value: number;
  readonly deltaPercent: number | null;
}

export interface DailyPoint {
  readonly date: string;
  readonly amount: number;
}

export interface CategoryShare {
  readonly name: string;
  readonly amount: number;
  readonly percent: number;
}

export interface SellerShare {
  readonly name: string;
  readonly amount: number;
  readonly percent: number;
}

export interface TopProduct {
  readonly rank: number;
  readonly sku: string;
  readonly name: string;
  readonly category: string | null;
  readonly units: number;
  readonly revenue: number;
  readonly marginPercent: number | null;
}

/** Mirrors SalesReportResponse from GET /api/v1/reports/sales. */
export interface SalesReport {
  readonly from: string;
  readonly to: string;
  readonly totalSales: MetricDelta;
  readonly transactions: MetricDelta;
  readonly averageTicket: MetricDelta;
  readonly unitsSold: MetricDelta;
  readonly dailySeries: readonly DailyPoint[];
  readonly byCategory: readonly CategoryShare[];
  readonly topProducts: readonly TopProduct[];
  readonly bySeller: readonly SellerShare[];
}

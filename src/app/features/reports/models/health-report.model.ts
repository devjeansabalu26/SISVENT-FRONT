import { MetricDelta } from './sales-report.model';

export interface HealthProfit {
  readonly profit: number | null;
  readonly profitDeltaPercent: number | null;
  readonly marginPercent: number | null;
  readonly previousMarginPercent: number | null;
  readonly missingCost: boolean;
}

export interface HealthLeaks {
  readonly discounts: number;
  readonly cancelledSales: number;
  readonly cancelledAmount: number;
  readonly cashShortage: number;
  readonly total: number;
}

export interface DormantProduct {
  readonly sku: string;
  readonly name: string;
  readonly stock: number;
  readonly value: number;
  readonly daysWithoutSale: number | null;
}

export interface HealthDormantStock {
  readonly days: number;
  readonly value: number;
  readonly products: number;
  readonly productsWithoutCost: number;
  readonly top: readonly DormantProduct[];
}

export interface HealthMonthOutlook {
  readonly monthToDate: number;
  readonly projected: number;
  readonly previousMonth: number;
  readonly daysElapsed: number;
  readonly daysInMonth: number;
  readonly projectedDeltaPercent: number | null;
}

export interface HealthReport {
  readonly from: string;
  readonly to: string;
  readonly sales: MetricDelta;
  readonly profit: HealthProfit;
  readonly leaks: HealthLeaks;
  readonly dormant: HealthDormantStock;
  readonly month: HealthMonthOutlook;
}

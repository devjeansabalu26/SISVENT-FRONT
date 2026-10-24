export interface CustomerReportSummary {
  readonly identifiedCustomers: number;
  readonly newCustomers: number;
  readonly identifiedSales: number;
  readonly identifiedAmount: number;
  readonly totalSales: number;
  readonly totalAmount: number;
  readonly identifiedPercent: number;
  readonly averageTicketIdentified: number;
  readonly averageTicketGeneral: number;
  readonly businessCustomers: number;
  readonly businessAmount: number;
  readonly lapsedCustomers: number;
}

export interface CustomerRankRow {
  readonly id: string;
  readonly name: string;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly phone: string | null;
  readonly isBusiness: boolean;
  readonly purchases: number;
  readonly amount: number;
  readonly averageTicket: number;
  readonly lastPurchaseAt: string | null;
  readonly averageDaysBetween: number | null;
}

export interface LapsedCustomerRow {
  readonly id: string;
  readonly name: string;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly phone: string | null;
  readonly isBusiness: boolean;
  readonly purchases: number;
  readonly amount: number;
  readonly lastPurchaseAt: string;
  readonly daysSinceLastPurchase: number;
  readonly averageDaysBetween: number | null;
}

export interface CustomerReport {
  readonly from: string;
  readonly to: string;
  readonly lapsedAfterDays: number;
  readonly lookbackDays: number;
  readonly minPurchasesForLapsed: number;
  readonly summary: CustomerReportSummary;
  readonly frequent: readonly CustomerRankRow[];
  readonly lapsed: readonly LapsedCustomerRow[];
  readonly business: readonly CustomerRankRow[];
}

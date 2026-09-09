export interface SalesReportRow {
  readonly id: string;
  readonly period: string;
  readonly salesCount: number;
  readonly revenue: number;
  readonly averageTicket: number;
  readonly topSeller: string;
}

export interface SalesChartPoint {
  readonly label: string;
  readonly amount: number;
}

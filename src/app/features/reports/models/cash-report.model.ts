export type CashIssueReason = 'SHORTAGE' | 'SURPLUS' | 'FORCED' | 'LONG_OPEN';

export interface CashReportSummary {
  readonly closedSessions: number;
  readonly sessionsWithDifference: number;
  readonly shortage: number;
  readonly surplus: number;
  readonly netDifference: number;
  readonly forcedCloses: number;
  readonly openNow: number;
  readonly longOpen: number;
}

export interface CashierCashRow {
  readonly name: string;
  readonly sessions: number;
  readonly withDifference: number;
  readonly shortage: number;
  readonly surplus: number;
  readonly netDifference: number;
  readonly forced: number;
}

export interface CashDayRow {
  readonly date: string;
  readonly sessions: number;
  readonly shortage: number;
  readonly surplus: number;
  readonly netDifference: number;
}

export interface PaymentMethodShare {
  readonly code: string;
  readonly name: string;
  readonly transactions: number;
  readonly amount: number;
  readonly percent: number;
}

export interface CashSessionIssue {
  readonly id: string;
  readonly storeName: string;
  readonly openedBy: string;
  readonly closedBy: string | null;
  readonly openedAt: string;
  readonly closedAt: string | null;
  readonly expectedCash: number | null;
  readonly countedCash: number | null;
  readonly difference: number | null;
  readonly forced: boolean;
  readonly forceReason: string | null;
  readonly hoursOpen: number;
  readonly reasons: readonly CashIssueReason[];
}

export interface CashReport {
  readonly from: string;
  readonly to: string;
  readonly longOpenHours: number;
  readonly summary: CashReportSummary;
  readonly byCashier: readonly CashierCashRow[];
  readonly byDay: readonly CashDayRow[];
  readonly paymentMethods: readonly PaymentMethodShare[];
  readonly issues: readonly CashSessionIssue[];
}

export const CASH_REASON_LABEL: Readonly<Record<CashIssueReason, string>> = {
  SHORTAGE: 'Faltante',
  SURPLUS: 'Sobrante',
  FORCED: 'Cierre forzado',
  LONG_OPEN: 'Abierta mucho tiempo',
};

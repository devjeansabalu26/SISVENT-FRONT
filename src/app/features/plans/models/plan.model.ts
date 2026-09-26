/** Mirrors PlanListItem from GET /api/v1/plans. */
export interface Plan {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly currentPrice: number | null;
  readonly currencyCode: string;
  readonly isActive: boolean;
  readonly maxAdmins: number | null;
  readonly maxSellers: number | null;
  readonly maxStores: number | null;
  readonly featureCount: number;
  readonly companyCount: number;
}

export interface PlanFeatureRow {
  readonly domain: string;
  readonly code: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface PlanLimitRow {
  readonly code: string;
  readonly value: number | null;
  readonly description: string | null;
}

export interface PlanPriceHistoryRow {
  readonly oldPrice: number | null;
  readonly newPrice: number;
  readonly reason: string | null;
  readonly changedAt: string;
  readonly changedByName: string | null;
}

/** Historial de cambios del plan en sí (alta/edición), distinto del historial de precios: sale de audit_logs. */
export interface PlanChangeLogEntry {
  readonly changedAt: string;
  readonly actorName: string | null;
  readonly action: string;
  readonly detail: string | null;
}

export interface PlanDetail {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly currentPrice: number | null;
  readonly currencyCode: string;
  readonly isActive: boolean;
  readonly companyCount: number;
  readonly limits: readonly PlanLimitRow[];
  readonly features: readonly PlanFeatureRow[];
  readonly priceHistory: readonly PlanPriceHistoryRow[];
  readonly changeHistory: readonly PlanChangeLogEntry[];
}

export interface FeatureMatrixCell {
  readonly planCode: string;
  readonly enabled: boolean;
}

export interface FeatureMatrixRow {
  readonly domain: string;
  readonly featureCode: string;
  readonly featureName: string;
  readonly plans: readonly FeatureMatrixCell[];
}

export interface FeatureMatrix {
  readonly planCodes: readonly string[];
  readonly rows: readonly FeatureMatrixRow[];
}

export interface PlanFormValue {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly currentPrice: number | null;
  readonly isActive: boolean;
  readonly maxAdmins: number | null;
  readonly maxSellers: number | null;
  readonly maxStores: number | null;
  readonly featureCodes: readonly string[];
  readonly priceChangeReason?: string;
}

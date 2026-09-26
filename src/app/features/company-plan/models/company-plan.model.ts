/** Mirrors MyPlanResponse and PlanChangeRequest* from /api/v1/company/plan. */
export interface MyPlanCurrent {
  readonly planId: string;
  readonly code: string;
  readonly name: string;
  readonly contractedPrice: number;
  readonly currencyCode: string;
  /** `YYYY-MM-DD` */
  readonly startDate: string;
  /** `YYYY-MM-DD` */
  readonly endDate: string;
  /** Estado efectivo: ACTIVE, PENDING, EXPIRED, SUSPENDED, INACTIVE. */
  readonly status: string;
  readonly daysRemaining: number;
}

/** `limit` null = ilimitado. */
export interface MyPlanUsage {
  readonly code: string;
  readonly label: string;
  readonly used: number;
  readonly limit: number | null;
}

export interface AvailablePlan {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  /** null = precio a consultar. */
  readonly price: number | null;
  readonly currencyCode: string;
  readonly maxSellers: number | null;
  readonly maxStores: number | null;
  readonly maxProducts: number | null;
  readonly features: readonly string[];
  /** Códigos (AUDIT, REPORTS…) para saber qué plan incluye un módulo. */
  readonly featureCodes?: readonly string[];
  readonly isCurrent: boolean;
}

export interface MyPlanPeriod {
  readonly id: string;
  readonly planName: string;
  readonly previousPlanName: string | null;
  readonly contractedPrice: number;
  readonly currencyCode: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface PlanChangeRequestInfo {
  readonly planId: string;
  readonly planName: string;
  readonly requestedAt: string;
}

export interface MyPlan {
  readonly current: MyPlanCurrent | null;
  readonly usage: readonly MyPlanUsage[];
  readonly plans: readonly AvailablePlan[];
  readonly history: readonly MyPlanPeriod[];
  readonly pendingRequest: PlanChangeRequestInfo | null;
}

export interface PlanChangeRequestResult {
  readonly planId: string;
  readonly planName: string;
  readonly notifiedCount: number;
  readonly requestedAt: string;
}

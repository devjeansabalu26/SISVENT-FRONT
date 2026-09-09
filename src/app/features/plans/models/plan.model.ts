export interface PlanListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly price: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly sellerLimit: string;
  readonly localLimit: string;
  readonly modules: string;
  readonly companyCount: number;
}

export interface PlanFeatureRow {
  readonly feature: string;
  readonly essential: string;
  readonly business: string;
  readonly professional: string;
}

export interface PlanFormValue {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly price: number;
  readonly billing: string;
  readonly sellerLimit: number;
  readonly localLimit: number;
  readonly unlimitedProducts: boolean;
  readonly productLimit: number;
  readonly modules: readonly string[];
}

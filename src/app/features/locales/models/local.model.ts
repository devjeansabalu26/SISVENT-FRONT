export interface Store {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly isActive: boolean;
  readonly sellerCount: number;
  readonly version: number;
}

export interface StorePlanLimit {
  readonly used: number;
  readonly total: number | null;
  readonly planName: string | null;
}

export interface StoreListResponse {
  readonly items: readonly Store[];
  readonly limit: StorePlanLimit;
}

export interface StoreFormValue {
  readonly name: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly isActive: boolean;
}

export interface LocalItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly sellerCount: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
}

export interface LocalFormValue {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly isActive: boolean;
}

export interface PlanLimit {
  readonly used: number;
  readonly total: number;
  readonly planName: string;
}

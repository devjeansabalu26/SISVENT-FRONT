/** Mirrors ClientListItem from GET /api/v1/clients. */
export interface Customer {
  readonly id: string;
  readonly type: 'PERSON' | 'COMPANY';
  readonly displayName: string;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly totalPurchases: number;
  readonly lastPurchaseAt: string | null;
  readonly isActive: boolean;
  readonly version: number;
}

export interface CustomerPage {
  readonly items: readonly Customer[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

/** Mirrors ClientDetailResponse from GET /api/v1/clients/{id}. */
export interface CustomerDetail {
  readonly id: string;
  readonly type: 'PERSON' | 'COMPANY';
  readonly displayName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly purchaseCount: number;
  readonly totalAmount: number;
  readonly lastPurchaseAt: string | null;
  readonly averageTicket: number;
  readonly version: number;
}

/** Mirrors ClientSummaryResponse from GET /api/v1/clients/summary. */
export interface CustomerSummary {
  readonly total: number;
  readonly active: number;
  readonly newThisMonth: number;
  readonly averagePurchases: number;
}

export interface CustomerFormValue {
  readonly displayName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
}

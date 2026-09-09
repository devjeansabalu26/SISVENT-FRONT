export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface SupplierListItem {
  readonly id: string;
  readonly taxId: string;
  readonly legalName: string;
  readonly commercialName: string;
  readonly sector: string;
  readonly contactName: string;
  readonly phone: string;
  readonly totalPurchases: number;
  readonly lastPurchase: string;
  readonly status: SupplierStatus;
}

export interface SupplierFormValue {
  readonly documentType: string;
  readonly taxId: string;
  readonly legalName: string;
  readonly commercialName: string;
  readonly sector: string;
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly city: string;
  readonly region: string;
  readonly notes: string;
  readonly isActive: boolean;
}

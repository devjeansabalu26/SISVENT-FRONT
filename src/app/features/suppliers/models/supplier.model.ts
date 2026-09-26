/** Mirrors SupplierResponse from /api/v1/suppliers. */
export interface Supplier {
  readonly id: string;
  readonly taxDocument: string | null;
  readonly businessName: string;
  readonly contactName: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly version: number;
}

export interface SupplierPage {
  readonly items: readonly Supplier[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface SupplierFormValue {
  readonly taxDocument: string | null;
  readonly businessName: string;
  readonly contactName: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
}

export interface Brand {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly version: number;
  readonly createdAt?: string | null;
}

export interface BrandPage {
  readonly items: readonly Brand[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface BrandFormValue {
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
}

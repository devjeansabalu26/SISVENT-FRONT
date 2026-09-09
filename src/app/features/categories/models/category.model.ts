/** Mirrors CategoryResponse from /api/v1/categories. */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly version: number;
}

export interface CategoryPage {
  readonly items: readonly Category[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface CategoryFormValue {
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
}

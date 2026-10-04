export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly version: number;
  readonly parentId?: string | null;
  readonly parentName?: string | null;
  readonly productCount?: number;
}

export interface CategoryFormData {
  readonly category: Category | null;
  readonly parents: readonly Category[];
  readonly hasChildren: boolean;
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
  readonly parentId: string | null;
}

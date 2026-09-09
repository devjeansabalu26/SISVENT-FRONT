export interface BrandListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categories: readonly string[];
  readonly productCount: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
}

export interface BrandFormValue {
  readonly name: string;
  readonly description: string;
  readonly categories: readonly string[];
  readonly isActive: boolean;
}

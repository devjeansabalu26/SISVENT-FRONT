export interface Product {
  readonly id: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly name: string;
  readonly categoryName: string | null;
  readonly brandName: string | null;
  readonly salePrice: number;
  readonly referenceCost: number | null;
  readonly isActive: boolean;
  readonly totalStock: number;
  readonly lowStock: boolean;
  readonly version: number;
  readonly stores?: readonly ProductStoreStock[];
}

export interface ProductStoreStock {
  readonly storeId: string;
  readonly storeName: string;
  readonly currentStock: number;
  readonly minStock: number;
}

export interface ProductPage {
  readonly items: readonly Product[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface ProductDetail {
  readonly id: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly brandId: string | null;
  readonly brandName: string | null;
  readonly unitId: string | null;
  readonly unitName: string | null;
  readonly salePrice: number;
  readonly referenceCost: number | null;
  readonly imageUrl: string | null;
  readonly isActive: boolean;
  readonly totalStock: number;
  readonly minStock: number;
  readonly version: number;
}

export interface ProductPriceHistoryItem {
  readonly oldPrice: number;
  readonly newPrice: number;
  readonly reason: string;
  readonly changedAt: string;
}

export interface ProductCreateValue {
  readonly name: string;
  readonly sku?: string;
  readonly barcode?: string | null;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly brandId: string | null;
  readonly unitId: string | null;
  readonly salePrice: number;
  readonly referenceCost: number | null;
  readonly imageUrl?: string | null;
  readonly isActive: boolean;
  readonly initialStoreId?: string | null;
  readonly initialStock?: number | null;
  readonly minStock?: number | null;
}

export interface ProductUpdateValue {
  readonly name: string;
  readonly sku: string;
  readonly barcode?: string | null;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly brandId: string | null;
  readonly unitId: string | null;
  readonly salePrice: number;
  readonly referenceCost: number | null;
  readonly imageUrl?: string | null;
  readonly isActive: boolean;
  readonly priceChangeReason?: string;
  readonly version: number;
}

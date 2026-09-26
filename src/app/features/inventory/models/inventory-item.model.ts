export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/** Mirrors StockItem from GET /api/v1/inventory/stock, plus a synthetic `id` for the data table. */
export interface StockRow {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly currentStock: number;
  readonly minStock: number;
  readonly maxStock: number | null;
  readonly status: StockStatus;
  readonly updatedAt: string;
  readonly version: number;
}

export interface StockPage {
  readonly items: readonly StockRow[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export type StockAdjustmentType = 'In' | 'Out' | 'Set';

export interface StockAdjustmentRequest {
  readonly storeId: string;
  readonly productId: string;
  readonly type: StockAdjustmentType;
  readonly quantity: number;
  readonly minStock: number | null;
  readonly reason: string;
}

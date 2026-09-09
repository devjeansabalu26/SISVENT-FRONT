export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  readonly id: string;
  readonly sku: string;
  readonly productName: string;
  readonly category: string;
  readonly warehouse: string;
  readonly stock: number;
  readonly minimumStock: number;
  readonly status: StockStatus;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockAdjustment {
  readonly itemId: string;
  readonly type: StockMovementType;
  readonly quantity: number;
  readonly reason: string;
}

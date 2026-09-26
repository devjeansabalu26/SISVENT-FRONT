/** Mirrors GoodsReceiptListItem from GET /api/v1/goods-receipts. */
export interface GoodsReceiptListItem {
  readonly id: string;
  readonly receiptNumber: string;
  readonly receiptDate: string;
  readonly supplierName: string | null;
  readonly itemCount: number;
  readonly totalCost: number;
  readonly status: string;
  readonly receivedBy: string;
  readonly notes: string | null;
}

export interface GoodsReceiptPage {
  readonly items: readonly GoodsReceiptListItem[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface GoodsReceiptSummary {
  readonly monthCount: number;
  readonly unitsReceived: number;
  readonly totalValue: number;
  readonly pending: number;
}

export interface GoodsReceiptDetailLine {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly subtotal: number;
  readonly stockBefore: number | null;
  readonly stockAfter: number | null;
}

export interface GoodsReceiptDetail {
  readonly id: string;
  readonly receiptNumber: string;
  readonly status: string;
  readonly receiptDate: string;
  readonly confirmedAt: string | null;
  readonly storeId: string;
  readonly storeName: string;
  readonly supplierId: string | null;
  readonly supplierName: string | null;
  readonly supplierTaxDocument: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly receivedBy: string;
  readonly totalCost: number;
  readonly itemCount: number;
  readonly totalUnits: number;
  readonly notes: string | null;
  readonly lines: readonly GoodsReceiptDetailLine[];
}

export interface GoodsReceiptLineInput {
  readonly productId: string;
  readonly quantity: number;
  readonly unitCost: number;
}

export interface GoodsReceiptCreateValue {
  readonly storeId: string | null;
  readonly supplierId: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly receiptDate: string | null;
  readonly notes: string | null;
  readonly updateReferenceCost: boolean;
  readonly lines: readonly GoodsReceiptLineInput[];
}

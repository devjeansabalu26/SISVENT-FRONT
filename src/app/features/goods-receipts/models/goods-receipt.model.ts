export type GoodsReceiptStatus = 'Completado' | 'Pendiente' | 'Anulado';

export interface GoodsReceiptLine {
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly previousStock?: number;
  readonly newStock?: number;
}

export interface GoodsReceiptListItem {
  readonly id: string;
  readonly code: string;
  readonly date: string;
  readonly supplier: string;
  readonly itemCount: number;
  readonly totalValue: number;
  readonly status: GoodsReceiptStatus;
  readonly receivedBy: string;
  readonly notes: string;
}

export interface GoodsReceiptDetail extends GoodsReceiptListItem {
  readonly time: string;
  readonly supplierTaxId: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly warehouse: string;
  readonly lines: readonly GoodsReceiptLine[];
}

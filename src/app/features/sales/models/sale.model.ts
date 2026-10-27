export interface Sale {
  readonly id: string;
  readonly saleNumber: string;
  readonly saleDate: string;
  readonly clientName: string | null;
  readonly sellerName: string;
  readonly storeName: string;
  readonly paymentMethod: string;
  readonly cashAmount?: number;
  readonly total: number;
  readonly status: 'CONFIRMED' | 'CANCELLED';
  readonly documentType?: 'BOLETA' | 'FACTURA';
  readonly documentNumber?: string | null;
}

export interface SalesTotals {
  readonly operationCount: number;
  readonly totalAmount: number;
}

export interface SalePage {
  readonly items: readonly Sale[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly periodTotals: SalesTotals;
}

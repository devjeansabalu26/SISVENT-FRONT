/** Mirrors SaleListItem from GET /api/v1/sales. */
export interface Sale {
  readonly id: string;
  readonly saleNumber: string;
  readonly saleDate: string;
  readonly clientName: string | null;
  readonly sellerName: string;
  readonly storeName: string;
  readonly paymentMethod: string;
  readonly total: number;
  readonly status: 'CONFIRMED' | 'CANCELLED';
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

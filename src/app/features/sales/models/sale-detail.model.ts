export interface SaleDetailLine {
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
}

export interface SaleEvent {
  readonly time: string;
  readonly description: string;
}

export interface SaleDetail {
  readonly id: string;
  readonly number: string;
  readonly status: 'COMPLETADA' | 'ANULADA';
  readonly dateTime: string;
  readonly lines: readonly SaleDetailLine[];
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly paymentMethod: string;
  readonly amountReceived: number;
  readonly change: number;
  readonly seller: string;
  readonly branch: string;
  readonly terminal: string;
  readonly shift: string;
  readonly customerName: string;
  readonly customerDocument: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly events: readonly SaleEvent[];
}

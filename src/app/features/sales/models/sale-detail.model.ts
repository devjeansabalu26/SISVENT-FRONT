import { SalePayment } from './payment.model';

export interface SaleDetailLine {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discountAmount: number;
  readonly subtotal: number;
}

export interface SaleEvent {
  readonly time: string;
  readonly description: string;
}

export interface SaleDetail {
  readonly id: string;
  readonly saleNumber: string;
  readonly status: 'CONFIRMED' | 'CANCELLED';
  readonly saleDate: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly clientId: string | null;
  readonly clientName: string | null;
  readonly sellerName: string;
  readonly paymentMethod: string;
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly total: number;
  readonly tax: number;
  readonly notes: string | null;
  readonly lines: readonly SaleDetailLine[];
  readonly events: readonly SaleEvent[];
  readonly payments?: readonly SalePayment[];
  readonly changeAmount?: number;
  readonly clientEmail?: string | null;
}

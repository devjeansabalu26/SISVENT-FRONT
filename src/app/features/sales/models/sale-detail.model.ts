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

/** Mirrors SaleDetailResponse from GET /api/v1/sales/{id} and POST /api/v1/pos/sales. */
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
  /** Pagos de la venta (uno o varios métodos). */
  readonly payments?: readonly SalePayment[];
  /** Vuelto total entregado (solo efectivo). */
  readonly changeAmount?: number;
  /** Correo del cliente: destinatario por defecto al enviar el comprobante. */
  readonly clientEmail?: string | null;
}

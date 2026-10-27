import { SaleDocumentType } from '../utils/sale-document';
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
  readonly annulment?: SaleAnnulment | null;
  readonly documentType?: SaleDocumentType;
  readonly documentNumber?: string | null;
  readonly customerTaxId?: string | null;
  readonly customerLegalName?: string | null;
  readonly customerAddress?: string | null;
  readonly eInvoiceStatus?: string | null;
  readonly electronicDocuments?: readonly SaleElectronicDocument[];
}

export interface SaleElectronicDocument {
  readonly id: string;
  readonly kind: 'FACTURA' | 'NOTA_CREDITO';
  readonly number: string;
  readonly status: string;
  readonly lastError: string | null;
  readonly pdfUrl: string | null;
  readonly xmlUrl: string | null;
  readonly cdrUrl: string | null;
  readonly providerCode: string | null;
  readonly environment: string | null;
  readonly credentialSource: 'PROPIA' | 'GENERAL' | null;
}

export interface SaleAnnulmentItem {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly returnedQuantity: number;
  readonly wastedQuantity: number;
  readonly wasteStoreName: string | null;
}

export interface SaleAnnulment {
  readonly reason: string;
  readonly cancelledBy: string;
  readonly cancelledAt: string;
  readonly originalCashClosed: boolean;
  readonly refundAmount: number;
  readonly refundMethod: string | null;
  readonly refundPending: boolean;
  readonly items: readonly SaleAnnulmentItem[];
}

export interface SaleAnnulmentOptions {
  readonly saleId: string;
  readonly status: string;
  readonly canAnnul: boolean;
  readonly blockedReason: string | null;
  readonly cashClosed: boolean;
  readonly refundAmount: number;
  readonly defaultRefundMethod: string | null;
  readonly storeHasOpenCash: boolean;
  readonly wasteStoreId: string | null;
  readonly wasteStoreName: string | null;
}

export interface CancelSaleBody {
  readonly reason: string;
  readonly refundMethod: string | null;
  readonly lines: readonly { readonly productId: string; readonly returnQuantity: number; readonly wasteQuantity: number }[];
}

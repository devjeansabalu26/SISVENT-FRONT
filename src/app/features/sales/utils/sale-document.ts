import { PLAN_FEATURES } from '../../../core/auth/constants/plan-features.constant';

export type SaleDocumentType = 'BOLETA' | 'FACTURA';

export interface SaleDocumentInfo {
  readonly saleNumber: string;
  readonly documentType?: SaleDocumentType;
  readonly documentNumber?: string | null;
}

export const INVOICE_FEATURE = PLAN_FEATURES.eInvoicing;

const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export const EINVOICE_STATUS_LABEL: Readonly<Partial<Record<string, string>>> = {
  PENDIENTE: 'Pendiente de envío a SUNAT',
  ENVIADO: 'Enviada a SUNAT',
  ACEPTADO: 'Aceptada por SUNAT',
  RECHAZADO: 'Rechazada por SUNAT',
  ERROR: 'Error en el envío a SUNAT',
};

export function credentialLabel(doc: { readonly providerCode: string | null; readonly environment: string | null; readonly credentialSource: string | null }): string | null {
  if (!doc.providerCode) return null;
  const source = doc.credentialSource === 'GENERAL' ? 'credencial general' : doc.credentialSource === 'PROPIA' ? 'credencial propia' : null;
  const environment = doc.environment === 'PRODUCCION' ? 'producción' : 'pruebas';
  return [doc.providerCode, source, environment].filter(Boolean).join(' · ');
}

export function isInvoice(sale: SaleDocumentInfo): boolean {
  return sale.documentType === 'FACTURA' && !!sale.documentNumber;
}

export function documentNumber(sale: SaleDocumentInfo): string {
  return isInvoice(sale) ? sale.documentNumber! : sale.saleNumber;
}

export function documentTitle(sale: SaleDocumentInfo): string {
  return isInvoice(sale) ? 'FACTURA' : 'COMPROBANTE DE VENTA';
}

export function isValidRuc(value: string): boolean {
  const ruc = value.trim();
  if (!/^\d{11}$/.test(ruc)) return false;
  const sum = RUC_WEIGHTS.reduce((total, weight, index) => total + weight * Number(ruc[index]), 0);
  const check = (11 - (sum % 11)) % 10;
  return check === Number(ruc[10]);
}

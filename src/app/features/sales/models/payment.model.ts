/** Mirrors PaymentMethodOption from GET /api/v1/pos/payment-methods. */
export type PaymentKind = 'CASH' | 'CARD' | 'DIGITAL';

export interface PaymentMethodOption {
  readonly code: string;
  readonly name: string;
  readonly kind: PaymentKind;
}

export const CARD_BRANDS = [
  { value: 'VISA', label: 'Visa' },
  { value: 'MASTERCARD', label: 'Mastercard' },
  { value: 'AMEX', label: 'American Express' },
  { value: 'DINERS', label: 'Diners Club' },
  { value: 'OTRA', label: 'Otra' },
] as const;

export const MAX_PAYMENTS = 5;

/** Un pago que escribe el cajero en el POS (texto de los inputs; se normaliza al enviar). */
export interface PaymentDraftLine {
  /** Identificador local para @for. */
  readonly key: number;
  readonly methodCode: string;
  /** Monto que cubre (tarjeta/digital). En efectivo se calcula como lo que falta. */
  readonly amount: string;
  /** Solo efectivo: lo que entrega el cliente. Vacío = exacto. */
  readonly amountReceived: string;
  readonly reference: string;
  readonly authorizationCode: string;
  readonly cardBrand: string;
  readonly cardLast4: string;
}

let nextKey = 1;

export function newPaymentLine(methodCode: string, amount = ''): PaymentDraftLine {
  return {
    key: nextKey++,
    methodCode,
    amount,
    amountReceived: '',
    reference: '',
    authorizationCode: '',
    cardBrand: 'VISA',
    cardLast4: '',
  };
}

/** Mirrors PosPaymentLine (body `payments` de POST /api/v1/pos/sales). */
export interface PosPaymentLine {
  readonly method: string;
  readonly amount?: number;
  readonly amountReceived?: number;
  readonly reference?: string;
  readonly authorizationCode?: string;
  readonly cardBrand?: string;
  readonly cardLast4?: string;
}

/** Mirrors SalePaymentResponse. */
export interface SalePayment {
  readonly methodCode: string;
  readonly methodName: string;
  readonly kind: PaymentKind;
  readonly amount: number;
  readonly amountReceived: number | null;
  readonly changeAmount: number | null;
  readonly reference: string | null;
  readonly authorizationCode: string | null;
  readonly cardBrand: string | null;
  readonly cardLast4: string | null;
}

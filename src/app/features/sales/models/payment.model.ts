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

export interface PaymentDraftLine {
  readonly key: number;
  readonly methodCode: string;
  readonly amount: string;
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

export interface PosPaymentLine {
  readonly method: string;
  readonly amount?: number;
  readonly amountReceived?: number;
  readonly reference?: string;
  readonly authorizationCode?: string;
  readonly cardBrand?: string;
  readonly cardLast4?: string;
}

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

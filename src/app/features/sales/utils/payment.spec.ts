import { PaymentDraftLine, PaymentKind, newPaymentLine } from '../models/payment.model';
import { breakdown, paymentSummary, paymentsError, quickCashAmounts, toPaymentLines } from './payment';

const KINDS: Record<string, PaymentKind> = { CASH: 'CASH', CARD: 'CARD', YAPE: 'DIGITAL' };
const kindOf = (code: string): PaymentKind => KINDS[code] ?? 'DIGITAL';
const line = (code: string, changes: Partial<PaymentDraftLine> = {}): PaymentDraftLine => ({ ...newPaymentLine(code), ...changes });

describe('POS payments', () => {
  describe('single method', () => {
    it('cash: empty amount is exact payment, change computed', () => {
      expect(breakdown([line('CASH')], kindOf, 72.5)).toEqual(jasmine.objectContaining({ change: 0, pending: 0 }));
      expect(breakdown([line('CASH', { amountReceived: '100' })], kindOf, 72.5).change).toBe(27.5);
      expect(breakdown([line('CASH', { amountReceived: '80,50' })], kindOf, 80).change).toBe(0.5);
      expect(toPaymentLines([line('CASH')], kindOf, 72.5)).toEqual([{ method: 'CASH', amountReceived: 72.5 }]);
    });

    it('card without amount covers the total', () => {
      const lines = [line('CARD', { reference: '004512' })];
      expect(paymentsError(lines, kindOf, 6800)).toBeNull();
      expect(toPaymentLines(lines, kindOf, 6800)[0]).toEqual(jasmine.objectContaining({ method: 'CARD', amount: 6800, reference: '004512' }));
    });

    it('validates per kind', () => {
      expect(paymentsError([line('CASH', { amountReceived: '50' })], kindOf, 72.5)).toContain('no cubre');
      expect(paymentsError([line('CASH', { amountReceived: 'abc' })], kindOf, 72.5)).toContain('válido');
      expect(paymentsError([line('CARD')], kindOf, 10)).toContain('voucher');
      expect(paymentsError([line('CARD', { reference: '1', cardLast4: '12a4' })], kindOf, 10)).toContain('4 números');
      expect(paymentsError([line('YAPE', { reference: ' ' })], kindOf, 10)).toContain('operación');
    });
  });

  describe('mixed payments', () => {
    it('card 6000 + cash: cash covers 800 and gives change', () => {
      const lines = [line('CARD', { amount: '6000', reference: '004512' }), line('CASH', { amountReceived: '1000' })];
      expect(paymentsError(lines, kindOf, 6800)).toBeNull();
      expect(breakdown(lines, kindOf, 6800)).toEqual({ nonCash: 6000, due: 800, cashReceived: 1000, change: 200, pending: 0 });
      expect(toPaymentLines(lines, kindOf, 6800)).toEqual([
        { method: 'CARD', amount: 6000, reference: '004512', cardBrand: 'VISA', authorizationCode: undefined, cardLast4: undefined },
        { method: 'CASH', amountReceived: 1000 },
      ]);
    });

    it('shows what is still pending', () => {
      const lines = [line('CARD', { amount: '6000', reference: '1' }), line('YAPE', { amount: '300', reference: '2' })];
      expect(breakdown(lines, kindOf, 6800).pending).toBe(500);
      expect(paymentsError(lines, kindOf, 6800)).toContain('Falta cubrir S/ 500.00');
    });

    it('rejects invalid combinations', () => {
      const card = (amount: string) => line('CARD', { amount, reference: '1' });
      expect(paymentsError([card('7000'), line('CASH')], kindOf, 6800)).toContain('superan');
      expect(paymentsError([card('6800'), line('CASH', { amountReceived: '10' })], kindOf, 6800)).toContain('ya está cubierto');
      expect(paymentsError([card('6000'), line('CASH', { amountReceived: '500' })], kindOf, 6800)).toContain('no cubre');
      expect(paymentsError([line('CASH'), line('CASH')], kindOf, 100)).toContain('un solo pago');
      expect(paymentsError([card(''), line('CASH')], kindOf, 6800)).toContain('monto');
    });
  });

  it('suggests exact amount and the next bills above what is due', () => {
    expect(quickCashAmounts(72.5)).toEqual([72.5, 80, 100, 200]);
    expect(quickCashAmounts(800)).toEqual([800]);
    expect(quickCashAmounts(0)).toEqual([]);
  });

  it('summarizes each payment', () => {
    expect(paymentSummary({ methodName: 'Efectivo', amount: 800, amountReceived: 1000, changeAmount: 200 })).toBe(
      'Efectivo S/ 800.00 · Recibido S/ 1000.00 · Vuelto S/ 200.00',
    );
    expect(paymentSummary({ methodName: 'Tarjeta', amount: 6000, cardBrand: 'VISA', cardLast4: '4242', reference: '004512', authorizationCode: 'A1' })).toBe(
      'Tarjeta S/ 6000.00 · Visa •••• 4242 · Op. 004512 · Aut. A1',
    );
  });
});

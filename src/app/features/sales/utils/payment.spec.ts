import { PaymentDraftLine, PaymentKind, newPaymentLine } from '../models/payment.model';
import { breakdown, invalidPaymentFields, paymentSummary, paymentsError, quickCashAmounts, toPaymentLines } from './payment';

const KINDS: Record<string, PaymentKind> = { CASH: 'CASH', CARD: 'CARD', YAPE: 'DIGITAL' };
const kindOf = (code: string): PaymentKind => KINDS[code] ?? 'DIGITAL';
const line = (code: string, changes: Partial<PaymentDraftLine> = {}): PaymentDraftLine => ({ ...newPaymentLine(code), ...changes });

describe('POS payments', () => {
  describe('single method', () => {
    it('cash: the received amount must be written by hand, change computed', () => {
      expect(breakdown([line('CASH')], kindOf, 72.5)).toEqual(jasmine.objectContaining({ cashReceived: null, change: 0, pending: 72.5 }));
      expect(paymentsError([line('CASH')], kindOf, 72.5)).toBe('Escribe cuánto efectivo te entregó el cliente.');
      expect(paymentsError([line('CASH', { amountReceived: '72.5' })], kindOf, 72.5)).toBeNull();
      expect(breakdown([line('CASH', { amountReceived: '100' })], kindOf, 72.5).change).toBe(27.5);
      expect(breakdown([line('CASH', { amountReceived: '80,50' })], kindOf, 80).change).toBe(0.5);
      expect(toPaymentLines([line('CASH')], kindOf, 72.5)).toEqual([{ method: 'CASH', amountReceived: 72.5 }]);
    });

    it('cash: received less than total shows what is missing, more shows change', () => {
      expect(breakdown([line('CASH', { amountReceived: '50' })], kindOf, 86.4)).toEqual(jasmine.objectContaining({ change: 0, pending: 36.4 }));
      expect(breakdown([line('CASH', { amountReceived: '100' })], kindOf, 86.4)).toEqual(jasmine.objectContaining({ change: 13.6, pending: 0 }));
      expect(breakdown([line('CASH', { amountReceived: '86.40' })], kindOf, 86.4)).toEqual(jasmine.objectContaining({ change: 0, pending: 0 }));
      expect(breakdown([line('YAPE', { amount: '50' }), line('CASH', { amountReceived: '40' })], kindOf, 86.4))
        .toEqual(jasmine.objectContaining({ due: 36.4, change: 3.6, pending: 0 }));
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
      'Efectivo S/ 800.00 · Recibido S/ 1,000.00 · Vuelto S/ 200.00',
    );
    expect(paymentSummary({ methodName: 'Tarjeta', amount: 6000, cardBrand: 'VISA', cardLast4: '4242', reference: '004512', authorizationCode: 'A1' })).toBe(
      'Tarjeta S/ 6,000.00 · Visa •••• 4242 · Op. 004512 · Aut. A1',
    );
  });

  describe('campos en rojo', () => {
    it('marca el monto recibido vacío o que no cubre el total', () => {
      const cash = line('CASH');
      expect(invalidPaymentFields([cash], kindOf, 86.4).has(`${cash.key}:amountReceived`)).toBeTrue();
      const short = line('CASH', { amountReceived: '50' });
      expect(invalidPaymentFields([short], kindOf, 86.4).has(`${short.key}:amountReceived`)).toBeTrue();
      const ok = line('CASH', { amountReceived: '100' });
      expect(invalidPaymentFields([ok], kindOf, 86.4).size).toBe(0);
    });

    it('marca el n.º de operación vacío y el monto faltante en pago mixto', () => {
      const yape = line('YAPE');
      const cash = line('CASH', { amountReceived: '100' });
      const bad = invalidPaymentFields([yape, cash], kindOf, 86.4);
      expect(bad.has(`${yape.key}:reference`)).toBeTrue();
      expect(bad.has(`${yape.key}:amount`)).toBeTrue();
      expect(bad.has(`${cash.key}:amountReceived`)).toBeFalse();
    });

    it('marca los últimos dígitos de tarjeta mal escritos', () => {
      const card = line('CARD', { reference: '004512', cardLast4: '42' });
      expect([...invalidPaymentFields([card], kindOf, 50)]).toEqual([`${card.key}:cardLast4`]);
    });
  });
});

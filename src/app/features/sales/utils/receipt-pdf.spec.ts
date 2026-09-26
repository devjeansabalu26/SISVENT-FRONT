import { SaleDetail } from '../models/sale-detail.model';
import { receiptRows } from './receipt-pdf';

const sale: SaleDetail = {
  id: 's1',
  saleNumber: 'V-20260926-0001',
  status: 'CONFIRMED',
  saleDate: '2026-09-26T15:30:00Z',
  storeId: 'st1',
  storeName: 'Local Principal',
  clientId: null,
  clientName: null,
  sellerName: 'Ana Pérez',
  paymentMethod: 'Tarjeta + Efectivo',
  subtotal: 6800,
  discountTotal: 0,
  total: 6800,
  tax: 1037.29,
  notes: null,
  lines: [{ productId: 'p1', sku: 'LAP-01', productName: 'Laptop', quantity: 1, unitPrice: 6800, discountAmount: 0, subtotal: 6800 }],
  events: [],
  payments: [
    { methodCode: 'CARD', methodName: 'Tarjeta', kind: 'CARD', amount: 6000, amountReceived: null, changeAmount: null, reference: '004512', authorizationCode: '111', cardBrand: 'VISA', cardLast4: '4242' },
    { methodCode: 'CASH', methodName: 'Efectivo', kind: 'CASH', amount: 800, amountReceived: 1000, changeAmount: 200, reference: null, authorizationCode: null, cardBrand: null, cardLast4: null },
  ],
  changeAmount: 200,
};

describe('receipt PDF rows', () => {
  const texts = receiptRows(sale, 'JEAN SAC').map((row) =>
    row.kind === 'text' ? row.text : row.kind === 'pair' ? `${row.left}=${row.right}` : row.kind,
  );

  it('uses the company name and sale number', () => {
    expect(texts[0]).toBe('JEAN SAC');
    expect(texts).toContain('V-20260926-0001');
    expect(texts).toContain('Cliente=Cliente general');
  });

  it('lists every payment of a mixed sale with its data', () => {
    expect(texts).toContain('Tarjeta=S/ 6000.00');
    expect(texts).toContain('  Tarjeta=VISA **** 4242');
    expect(texts).toContain('  N.º operación=004512');
    expect(texts).toContain('Efectivo=S/ 800.00');
    expect(texts).toContain('  Recibido=S/ 1000.00');
    expect(texts).toContain('  Vuelto=S/ 200.00');
    expect(texts).toContain('TOTAL=S/ 6800.00');
  });

  it('marks cancelled sales', () => {
    const rows = receiptRows({ ...sale, status: 'CANCELLED' }, 'JEAN SAC');
    expect(rows.some((row) => row.kind === 'text' && row.text.includes('ANULADA'))).toBeTrue();
  });
});

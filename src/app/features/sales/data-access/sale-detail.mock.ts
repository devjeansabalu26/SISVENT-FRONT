import { SaleDetail } from '../models/sale-detail.model';

/** Placeholder detail — no backend endpoint for a single sale yet. */
export const SALE_DETAIL_MOCK: SaleDetail = {
  id: '892',
  number: 'V-2026-0892',
  status: 'COMPLETADA',
  dateTime: '01/09/2026 14:32',
  lines: [
    { productName: 'Mouse Gamer RGB Pro', sku: 'MOU-RGB-01', quantity: 2, unitPrice: 99.9, discount: 0 },
    { productName: 'Teclado Mecánico K70', sku: 'TEC-K70-ME', quantity: 1, unitPrice: 189, discount: 0 },
    { productName: 'Mousepad XL Gaming', sku: 'PAD-XLG-05', quantity: 1, unitPrice: 45, discount: 0 },
  ],
  subtotal: 368.47,
  tax: 66.33,
  total: 434.8,
  paymentMethod: 'Efectivo',
  amountReceived: 500,
  change: 65.2,
  seller: 'María Torres',
  branch: 'Centro',
  terminal: 'T-01',
  shift: 'Tarde',
  customerName: 'Ana María López',
  customerDocument: 'DNI 45678912',
  customerEmail: 'ana@gmail.com',
  customerPhone: '987654001',
  events: [
    { time: '14:30', description: 'Venta iniciada en caja' },
    { time: '14:32', description: 'Pago recibido en efectivo' },
    { time: '14:32', description: 'Comprobante B001-0000892 emitido' },
    { time: '14:33', description: 'Stock de inventario actualizado' },
  ],
};

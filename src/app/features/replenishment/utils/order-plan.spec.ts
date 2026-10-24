import { StockRiskItem } from '../models/replenishment.model';
import { byOrderUrgency, goodsReceiptPrefill, groupBySupplier, orderDeadline, whatsappOrderText, whatsappUrl } from './order-plan';

function item(partial: Partial<StockRiskItem>): StockRiskItem {
  return {
    productId: partial.name ?? 'p', sku: 'SKU', name: 'Producto', currentStock: 10, minStock: 2, averageDailySales: 1,
    coverageDays: 10, risk: 'OPTIMAL', supplierName: 'Proveedor A', leadTimeDays: 5, safetyStock: 2,
    suggestedQuantity: 0, priority: null, reorderPoint: 7, daysToOrder: 3, orderStatus: 'ORDER_SOON', orderQuantity: 7,
    ...partial,
  };
}

describe('order-plan', () => {
  const today = '2026-10-24';

  it('calcula la fecha límite desde hoy', () => {
    expect(orderDeadline(item({ daysToOrder: 3.6 }), today).date).toBe('2026-10-27');
    expect(orderDeadline(item({ daysToOrder: 0.4, orderStatus: 'ORDER_NOW' }), today).label).toBe('Hoy');
    expect(orderDeadline(item({ daysToOrder: 1.2 }), today).label).toContain('Mañana');
  });

  it('marca como atrasado lo que ya debió pedirse', () => {
    const deadline = orderDeadline(item({ daysToOrder: -2.5, orderStatus: 'ORDER_NOW' }), today);
    expect(deadline.overdue).toBeTrue();
    expect(deadline.date).toBe('2026-10-21');
  });

  it('sin ventas no tiene fecha, salvo que esté bajo el mínimo', () => {
    expect(orderDeadline(item({ daysToOrder: null, orderStatus: 'NO_SALES' }), today).date).toBeNull();
    expect(orderDeadline(item({ daysToOrder: null, orderStatus: 'ORDER_NOW' }), today).label).toBe('Hoy');
  });

  it('ordena primero lo más urgente', () => {
    const list = [
      item({ name: 'C', orderStatus: 'OK', daysToOrder: 20 }),
      item({ name: 'B', orderStatus: 'ORDER_SOON', daysToOrder: 2 }),
      item({ name: 'A', orderStatus: 'ORDER_NOW', daysToOrder: -1 }),
    ].sort(byOrderUrgency);
    expect(list.map((i) => i.name)).toEqual(['A', 'B', 'C']);
  });

  it('arma el mensaje de WhatsApp y el ingreso precargado del pedido', () => {
    const [order] = groupBySupplier(
      [item({ name: 'Ron Cartavio', sku: 'RON-1', supplierName: 'Andina', orderStatus: 'ORDER_NOW', orderQuantity: 12, referenceCost: 23.4 })],
      today,
    );
    const text = whatsappOrderText(order, 'Licorería Demo');
    expect(text).toContain('Hola, Andina.');
    expect(text).toContain('para Licorería Demo');
    expect(text).toContain('• 12 uds — Ron Cartavio (RON-1)');
    expect(whatsappUrl(text)).toMatch(/^https:\/\/wa\.me\/\?text=Hola%2C%20Andina/);
    const prefill = goodsReceiptPrefill(order);
    expect(prefill.supplierName).toBe('Andina');
    expect(prefill.lines).toEqual([{ productId: 'Ron Cartavio', quantity: 12, unitCost: 23.4 }]);
    expect(prefill.asOrder).toBeTrue();
  });

  it('agrupa por proveedor solo lo que hay que pedir', () => {
    const groups = groupBySupplier(
      [
        item({ name: 'Ron', supplierName: 'Andina', orderStatus: 'ORDER_NOW', daysToOrder: -1, orderQuantity: 10 }),
        item({ name: 'Pisco', supplierName: 'Andina', orderStatus: 'ORDER_SOON', daysToOrder: 2, orderQuantity: 5 }),
        item({ name: 'Vino', supplierName: 'Bodegas', orderStatus: 'OK', daysToOrder: 12, orderQuantity: 6 }),
        item({ name: 'Hielo', supplierName: null, orderStatus: 'ORDER_SOON', daysToOrder: 1, orderQuantity: 4 }),
      ],
      today,
    );
    expect(groups.map((g) => g.supplier)).toEqual(['Andina', 'Sin proveedor asignado']);
    expect(groups[0].units).toBe(15);
    expect(groups[0].earliest).toBe('2026-10-23');
  });
});

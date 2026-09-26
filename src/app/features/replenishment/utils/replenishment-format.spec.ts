import { StockRiskItem } from '../models/replenishment.model';
import { paretoPoints } from '../pages/abc-rotation-page';
import { formatQuantity, purchaseOrderCsv } from './replenishment-format';

const item = (name: string, supplierName: string | null, suggestedQuantity: number): StockRiskItem => ({
  productId: name,
  sku: name.toUpperCase(),
  name,
  currentStock: 3,
  minStock: 10,
  averageDailySales: 1.5,
  coverageDays: 2,
  risk: 'CRITICAL',
  supplierName,
  leadTimeDays: 7,
  safetyStock: 10,
  suggestedQuantity,
  priority: 'CRITICA',
});

describe('replenishment format', () => {
  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity(12)).toBe('12');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(0.333)).toBe('0.33');
  });

  it('builds the purchase order grouped by supplier, skipping zero quantities', () => {
    const csv = purchaseOrderCsv([item('mouse', 'Zeta SAC', 5), item('cable', null, 8), item('teclado', 'Alfa SA', 2), item('webcam', 'Alfa SA', 0)]);
    const lines = csv.replace('﻿', '').split('\n');
    expect(lines.length).toBe(4);
    expect(lines[1].startsWith('Alfa SA;TECLADO;teclado;2')).toBeTrue();
    expect(lines[2].startsWith('Zeta SAC;MOUSE')).toBeTrue();
    expect(lines[3].startsWith('Sin proveedor asignado;CABLE')).toBeTrue();
  });

  it('builds the pareto curve from the ranking', () => {
    const points = paretoPoints([
      { productId: 'a', sku: 'A', name: 'a', class: 'A', quantity: 1, revenue: 80, share: 80, cumulativeShare: 80, rotation: 'Alta', marginPercent: null },
      { productId: 'b', sku: 'B', name: 'b', class: 'B', quantity: 1, revenue: 20, share: 20, cumulativeShare: 100, rotation: 'Baja', marginPercent: null },
    ]);
    expect(points).toEqual([
      { products: 0, value: 0 },
      { products: 50, value: 80 },
      { products: 100, value: 100 },
    ]);
  });
});

import { computeSuggestedQuantity } from './suggested-quantity';

describe('computeSuggestedQuantity', () => {
  it('reproduce el ejemplo de Figma: (2.5 × 5) + 10 − 8 = 14.5 → 15', () => {
    const result = computeSuggestedQuantity({ currentStock: 8, averageDailySales: 2.5, leadTimeDays: 5, safetyStock: 10 });
    expect(result.raw).toBe(14.5);
    expect(result.rounded).toBe(15);
    expect(result.coverageDays).toBe(3.2);
  });

  it('no sugiere cantidades negativas cuando sobra stock', () => {
    const result = computeSuggestedQuantity({ currentStock: 100, averageDailySales: 1, leadTimeDays: 5, safetyStock: 10 });
    expect(result.raw).toBe(-85);
    expect(result.rounded).toBe(0);
  });

  it('sin ventas la cobertura es indefinida', () => {
    expect(computeSuggestedQuantity({ currentStock: 5, averageDailySales: 0, leadTimeDays: 5, safetyStock: 2 }).coverageDays).toBeNull();
  });
});

import { paretoPoints } from '../pages/abc-rotation-page';
import { formatQuantity } from './replenishment-format';

describe('replenishment format', () => {
  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity(12)).toBe('12');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(0.333)).toBe('0.33');
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

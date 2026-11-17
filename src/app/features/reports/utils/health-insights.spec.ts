import { HealthReport } from '../models/health-report.model';
import { healthInsights } from './health-insights';

const money = (value: number) => `S/ ${value.toFixed(2)}`;

function report(overrides: Partial<HealthReport> = {}): HealthReport {
  return {
    from: '2026-11-01T05:00:00Z',
    to: '2026-11-17T05:00:00Z',
    sales: { value: 1000, deltaPercent: 0 },
    profit: { profit: 300, profitDeltaPercent: 0, marginPercent: 30, previousMarginPercent: 30, missingCost: false },
    leaks: { discounts: 0, cancelledSales: 0, cancelledAmount: 0, cashShortage: 0, total: 0 },
    dormant: { days: 30, value: 0, products: 0, productsWithoutCost: 0, top: [] },
    month: { monthToDate: 500, projected: 1000, previousMonth: 1000, daysElapsed: 3, daysInMonth: 30, projectedDeltaPercent: 0 },
    ...overrides,
  };
}

describe('healthInsights', () => {
  it('says the business is stable when nothing stands out', () => {
    const list = healthInsights(report(), money);
    expect(list.length).toBe(1);
    expect(list[0].tone).toBe('success');
  });

  it('warns about a falling margin and money leaks', () => {
    const list = healthInsights(report({
      profit: { profit: 200, profitDeltaPercent: -30, marginPercent: 20, previousMarginPercent: 30, missingCost: false },
      leaks: { discounts: 40, cancelledSales: 1, cancelledAmount: 20, cashShortage: 0, total: 60 },
    }), money);
    expect(list.some((item) => item.tone === 'danger' && item.title.includes('20.0%'))).toBeTrue();
    expect(list.some((item) => item.title.includes('S/ 60.00'))).toBeTrue();
  });

  it('points out idle stock', () => {
    const list = healthInsights(report({ dormant: { days: 30, value: 250, products: 3, productsWithoutCost: 0, top: [] } }), money);
    expect(list.some((item) => item.title.includes('S/ 250.00') && item.title.includes('3 productos'))).toBeTrue();
  });
});

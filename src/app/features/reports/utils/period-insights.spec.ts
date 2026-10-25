import { compareMetric, periodInsights } from './period-insights';

describe('period-insights', () => {
  const series = [
    { date: '2026-10-01', amount: 100 },
    { date: '2026-10-02', amount: 50 },
    { date: '2026-10-04', amount: 300 },
    { date: '2026-10-05', amount: 150 },
  ];

  it('compara la segunda mitad del período con la primera', () => {
    const insights = periodInsights(series, '2026-10-01T05:00:00Z', '2026-10-06T05:00:00Z', 'America/Lima');
    expect(insights.days).toBe(5);
    expect(insights.firstHalf).toBe(150);
    expect(insights.secondHalf).toBe(450);
    expect(insights.trendPercent).toBe(200);
  });

  it('encuentra el mejor día de la semana, el día más flojo y los días sin ventas', () => {
    const insights = periodInsights(series, '2026-10-01T05:00:00Z', '2026-10-06T05:00:00Z', 'America/Lima');
    expect(insights.bestWeekday?.label).toBe('domingo');
    expect(insights.bestWeekday?.share).toBe(50);
    expect(insights.weakestDay?.date).toBe('2026-10-02');
    expect(insights.daysWithoutSales).toBe(1);
  });

  it('deduce el valor del período anterior desde la variación', () => {
    expect(compareMetric({ value: 120, deltaPercent: 20 })).toEqual({ current: 120, previous: 100, difference: 20, deltaPercent: 20 });
    expect(compareMetric({ value: 50, deltaPercent: null }).previous).toBeNull();
    expect(compareMetric({ value: 0, deltaPercent: -100 }).previous).toBeNull();
  });
});

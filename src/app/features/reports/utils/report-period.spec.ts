import { normalizePeriod, periodRange } from './report-period';

describe('report-period', () => {
  const now = new Date(2026, 9, 24, 15, 30);

  it('acepta solo periodos conocidos', () => {
    expect(normalizePeriod('7d')).toBe('7d');
    expect(normalizePeriod('month')).toBe('month');
    expect(normalizePeriod('999d')).toBeNull();
    expect(normalizePeriod(null)).toBeNull();
  });

  it('calcula los últimos N días hasta ahora', () => {
    const range = periodRange('7d', now);
    expect(range.to).toEqual(now);
    expect(range.from).toEqual(new Date(2026, 9, 17, 15, 30));
  });

  it('hoy empieza a medianoche', () => {
    expect(periodRange('today', now).from).toEqual(new Date(2026, 9, 24));
  });

  it('este mes y mes pasado usan meses calendario', () => {
    expect(periodRange('month', now).from).toEqual(new Date(2026, 9, 1));
    const last = periodRange('last-month', now);
    expect(last.from).toEqual(new Date(2026, 8, 1));
    expect(last.to).toEqual(new Date(2026, 9, 1));
  });

  it('mes pasado en enero cae en diciembre del año anterior', () => {
    expect(periodRange('last-month', new Date(2027, 0, 10)).from).toEqual(new Date(2026, 11, 1));
  });
});

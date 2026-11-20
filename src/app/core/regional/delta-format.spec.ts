import { moneyComparison, signedCount, signedMoney, deltaTrend } from './delta-format';

describe('delta-format', () => {
  it('muestra la diferencia de dinero con signo', () => {
    expect(signedMoney(520.3)).toContain('520.30');
    expect(signedMoney(520.3)?.startsWith('+')).toBe(true);
    expect(signedMoney(-80)?.startsWith('-')).toBe(true);
    expect(signedMoney(0)).toBe('Igual');
    expect(signedMoney(null)).toBeUndefined();
  });

  it('muestra la diferencia de cantidades', () => {
    expect(signedCount(5, 'operación', 'operaciones')).toBe('+5 operaciones');
    expect(signedCount(-1, 'operación', 'operaciones')).toBe('-1 operación');
  });

  it('describe la comparación en palabras', () => {
    expect(moneyComparison(-120, 'que el mes pasado')).toContain('menos que el mes pasado');
    expect(moneyComparison(null, 'del período anterior')).toBe('Sin datos del período anterior');
    expect(deltaTrend(-3)).toBe('down');
  });
});

import { TopProduct } from '../models/sales-report.model';
import { median, productMatrix } from './product-matrix';
import { buildHeatmap } from './sales-heatmap';

function product(name: string, units: number, marginPercent: number | null, revenue = units * 10): TopProduct {
  return { rank: 0, sku: name, name, category: null, units, revenue, marginPercent };
}

describe('product-matrix', () => {
  it('calcula la mediana', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it('clasifica en los cuatro cuadrantes según la mediana', () => {
    const matrix = productMatrix([
      product('estrella', 100, 40),
      product('gancho', 90, 10),
      product('oportunidad', 5, 45),
      product('revisar', 3, 5),
      product('sin-costo', 50, null),
    ]);
    const names = (quadrant: string) => matrix.groups.find((g) => g.quadrant === quadrant)!.products.map((p) => p.name);
    expect(names('star')).toEqual(['estrella']);
    expect(names('hook')).toEqual(['gancho']);
    expect(names('opportunity')).toEqual(['oportunidad']);
    expect(names('review')).toEqual(['revisar']);
    expect(matrix.withoutCost.map((p) => p.name)).toEqual(['sin-costo']);
  });
});

describe('sales-heatmap', () => {
  it('arma la grilla con las horas que tienen ventas y marca la hora pico', () => {
    const heatmap = buildHeatmap([
      { weekday: 6, hour: 21, transactions: 12, amount: 900 },
      { weekday: 1, hour: 10, transactions: 2, amount: 60 },
      { weekday: 5, hour: 20, transactions: 6, amount: 400 },
    ]);
    expect(heatmap.hours[0]).toBe(10);
    expect(heatmap.hours[heatmap.hours.length - 1]).toBe(21);
    expect(heatmap.rows.length).toBe(7);
    expect(heatmap.peak).toEqual({ weekday: 'sábado', hour: 21, transactions: 12, amount: 900 });
    expect(heatmap.strongestDay?.label).toBe('sábado');
    const saturday = heatmap.rows.find((row) => row.weekday === 6)!;
    expect(saturday.cells.find((cell) => cell.hour === 21)!.level).toBe(4);
    expect(saturday.cells.find((cell) => cell.hour === 10)!.level).toBe(0);
  });

  it('sin ventas no arma grilla', () => {
    expect(buildHeatmap([]).rows).toEqual([]);
  });
});

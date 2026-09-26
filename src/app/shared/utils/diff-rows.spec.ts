import { buildDiffRows, formatSoles } from './diff-rows';

interface Sample {
  readonly name: string;
  readonly price: number | null;
  readonly active: boolean;
  readonly notes: string | null;
}

describe('buildDiffRows', () => {
  const fields = [
    { key: 'name', label: 'Nombre' },
    { key: 'price', label: 'Precio', format: formatSoles },
    { key: 'active', label: 'Estado' },
    { key: 'notes', label: 'Notas' },
  ] as const;

  it('devuelve solo los campos modificados, en el orden declarado', () => {
    const rows = buildDiffRows<Sample>(
      { name: 'Mouse', price: 20, active: false, notes: null },
      { name: 'Mouse', price: 40, active: true, notes: null },
      fields,
    );
    expect(rows).toEqual([
      { field: 'Precio', before: 'S/ 20.00', after: 'S/ 40.00' },
      { field: 'Estado', before: 'Desactivado', after: 'Activado' },
    ]);
  });

  it('trata null y texto vacío como el mismo valor', () => {
    const rows = buildDiffRows<Sample>(
      { name: 'A', price: null, active: true, notes: null },
      { name: 'A', price: null, active: true, notes: '  ' },
      fields,
    );
    expect(rows).toEqual([]);
  });
});

describe('formatSoles', () => {
  it('formatea con dos decimales y guion para vacío', () => {
    expect(formatSoles(149)).toBe('S/ 149.00');
    expect(formatSoles(null)).toBe('—');
  });
});

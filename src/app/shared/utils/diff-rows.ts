/** Una fila "Campo / Antes / Después" de los modales de resumen de cambios (Figma MOD-SA-08, MOD-AD-14, MOD-AD-19). */
export interface DiffRow {
  readonly field: string;
  readonly before: string;
  readonly after: string;
}

/** Etiqueta visible y formateador opcional de cada campo comparado. */
export interface DiffField<T> {
  readonly key: keyof T & string;
  readonly label: string;
  readonly format?: (value: T[keyof T]) => string;
}

const EMPTY = '—';

function display(value: unknown): string {
  if (value === null || value === undefined) return EMPTY;
  if (typeof value === 'boolean') return value ? 'Activado' : 'Desactivado';
  const text = String(value).trim();
  return text === '' ? EMPTY : text;
}

/**
 * Compara dos snapshots y devuelve solo los campos cuyo valor mostrado cambió, en el orden de `fields`.
 * La comparación se hace sobre el texto formateado: así `20` y `20.00` con el mismo formateador no
 * aparecen como cambio, y un campo vacío en ambos lados (`null` / `''`) tampoco.
 */
export function buildDiffRows<T>(before: T, after: T, fields: readonly DiffField<T>[]): readonly DiffRow[] {
  const rows: DiffRow[] = [];
  for (const field of fields) {
    const format = field.format ?? display;
    const previous = format(before[field.key]);
    const next = format(after[field.key]);
    if (previous !== next) rows.push({ field: field.label, before: previous, after: next });
  }
  return rows;
}

/** Formatea montos en soles como en Figma: `S/ 20.00`. */
export function formatSoles(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  const amount = Number(value);
  return Number.isFinite(amount) ? `S/ ${amount.toFixed(2)}` : EMPTY;
}

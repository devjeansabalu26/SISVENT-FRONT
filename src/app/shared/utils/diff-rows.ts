export interface DiffRow {
  readonly field: string;
  readonly before: string;
  readonly after: string;
}

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

export function formatSoles(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  const amount = Number(value);
  return Number.isFinite(amount) ? `S/ ${amount.toFixed(2)}` : EMPTY;
}

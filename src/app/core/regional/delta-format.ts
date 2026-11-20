import { formatMoney } from './regional-format';

export type DeltaTrend = 'up' | 'down' | 'flat';

export function deltaTrend(value: number | null | undefined): DeltaTrend {
  if (value == null || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

export function signedMoney(value: number | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (value === 0) return 'Igual';
  return `${value > 0 ? '+' : '-'}${formatMoney(Math.abs(value))}`;
}

export function signedCount(value: number | null | undefined, singular: string, plural: string): string | undefined {
  if (value == null) return undefined;
  if (value === 0) return 'Igual';
  const size = Math.abs(value);
  return `${value > 0 ? '+' : '-'}${size.toLocaleString('es-PE')} ${size === 1 ? singular : plural}`;
}

export function moneyComparison(value: number | null | undefined, against: string): string {
  if (value == null) return `Sin datos ${against}`;
  if (value === 0) return `Igual ${against}`;
  return `${formatMoney(Math.abs(value))} ${value > 0 ? 'más' : 'menos'} ${against}`;
}

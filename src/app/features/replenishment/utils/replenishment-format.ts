import { formatMoney } from '../../../core/regional/regional-format';

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

export function formatSoles(value: number): string {
  return formatMoney(value);
}

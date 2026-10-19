import { CompanyRegional, PERU_REGIONAL } from './regional.model';

const EMPTY = '—';
let current: CompanyRegional = PERU_REGIONAL;
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function setRegional(regional: CompanyRegional): void {
  current = regional;
}

export function currentRegional(): CompanyRegional {
  return current;
}

function numberFormat(locale: string, decimals: number, maxDecimals = decimals): Intl.NumberFormat {
  const key = `${locale}|${decimals}|${maxDecimals}`;
  let format = numberFormats.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: maxDecimals });
    } catch {
      format = new Intl.NumberFormat('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: maxDecimals });
    }
    numberFormats.set(key, format);
  }
  return format;
}

export function roundMoney(value: number, regional: CompanyRegional = current): number {
  const factor = 10 ** regional.currencyDecimals;
  const scaled = Math.abs(value) * factor;
  return (Math.sign(value) * Math.round(scaled + Number.EPSILON * scaled)) / factor;
}

export function moneyAmount(value: number | null | undefined, regional: CompanyRegional = current): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return EMPTY;
  return numberFormat(regional.locale, regional.currencyDecimals).format(roundMoney(Number(value), regional));
}

export function formatMoney(value: number | null | undefined, regional: CompanyRegional = current): string {
  const amount = moneyAmount(value, regional);
  return amount === EMPTY ? EMPTY : `${regional.currencySymbol} ${amount}`;
}

export function formatQuantity(value: number | null | undefined, maxDecimals = 3): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return EMPTY;
  return numberFormat(current.locale, 0, maxDecimals).format(Number(value));
}

export function moneyStep(regional: CompanyRegional = current): string {
  return regional.currencyDecimals === 0 ? '1' : (1 / 10 ** regional.currencyDecimals).toFixed(regional.currencyDecimals);
}

export function cashStep(regional: CompanyRegional = current): string {
  return regional.currencyDecimals === 0 ? '1' : '0.10';
}

export function moneyInput(value: number, regional: CompanyRegional = current): string {
  return roundMoney(value, regional).toFixed(regional.currencyDecimals);
}

function dateParts(date: Date, timezone: string): Record<string, string> {
  let format = dateFormats.get(timezone);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      });
    } catch {
      format = new Intl.DateTimeFormat('en-GB', {
        timeZone: PERU_REGIONAL.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      });
    }
    dateFormats.set(timezone, format);
  }
  const parts: Record<string, string> = {};
  for (const part of format.formatToParts(date)) parts[part.type] = part.value;
  return parts;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function applyPattern(day: string, month: string, year: string, pattern: string): string {
  return pattern.replace('DD', day).replace('MM', month).replace('YYYY', year);
}

export function formatDate(value: string | Date | null | undefined, regional: CompanyRegional = current): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const p = dateParts(date, regional.timezone);
  return applyPattern(p['day'], p['month'], p['year'], regional.dateFormat);
}

export function formatTime(value: string | Date | null | undefined, regional: CompanyRegional = current): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const p = dateParts(date, regional.timezone);
  return `${p['hour']}:${p['minute']}`;
}

export function formatDateTime(value: string | Date | null | undefined, regional: CompanyRegional = current): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return `${formatDate(date, regional)} ${formatTime(date, regional)}`;
}

export function formatDayMonthTime(value: string | Date | null | undefined, regional: CompanyRegional = current): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  const p = dateParts(date, regional.timezone);
  const dayMonth = regional.dateFormat.startsWith('MM') ? `${p['month']}/${p['day']}` : `${p['day']}/${p['month']}`;
  return `${dayMonth} ${p['hour']}:${p['minute']}`;
}

export function formatCalendarDate(value: string | null | undefined, regional: CompanyRegional = current): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!match) return EMPTY;
  return applyPattern(match[3], match[2], match[1], regional.dateFormat);
}

export function companyToday(regional: CompanyRegional = current, at: Date = new Date()): string {
  const p = dateParts(at, regional.timezone);
  return `${p['year']}-${p['month']}-${p['day']}`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function receiptNote(regional: CompanyRegional = current): string {
  return regional.eInvoicingAuthority
    ? `Comprobante interno; no reemplaza un comprobante electrónico ${regional.eInvoicingAuthority}.`
    : 'Comprobante interno; no reemplaza un comprobante electrónico.';
}

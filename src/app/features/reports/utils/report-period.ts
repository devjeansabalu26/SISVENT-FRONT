export type ReportPeriod = 'today' | '7d' | '30d' | '90d' | '180d' | 'month' | 'last-month';

export const DEFAULT_PERIOD: ReportPeriod = '30d';

export const REPORT_PERIODS: readonly { readonly id: ReportPeriod; readonly label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: '180d', label: '180 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'last-month', label: 'Mes pasado' },
];

const DAYS: Readonly<Partial<Record<ReportPeriod, number>>> = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 };

export function normalizePeriod(value: string | null | undefined): ReportPeriod | null {
  return REPORT_PERIODS.some((period) => period.id === value) ? (value as ReportPeriod) : null;
}

export function periodLabel(period: ReportPeriod): string {
  return REPORT_PERIODS.find((item) => item.id === period)?.label ?? period;
}

export function periodRange(period: ReportPeriod, now: Date = new Date()): { readonly from: Date; readonly to: Date } {
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: now };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case 'last-month':
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - (DAYS[period] ?? 30));
      return { from, to: now };
    }
  }
}

import { addDays, companyToday } from '../../core/regional/regional-format';

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';

export const DATE_RANGE_PRESET_LABEL: Readonly<Record<DateRangePreset, string>> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7: 'Últimos 7 días',
  thisMonth: 'Este mes',
  lastMonth: 'Mes anterior',
};

export function resolveDateRange(preset: DateRangePreset, now = new Date()): { readonly from: string; readonly to: string } {
  const today = companyToday(undefined, now);
  const [year, month] = today.split('-').map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const day = addDays(today, -1);
      return { from: day, to: day };
    }
    case 'last7':
      return { from: addDays(today, -6), to: today };
    case 'thisMonth':
      return { from: monthStart, to: today };
    case 'lastMonth': {
      const previous = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
      return { from: previous, to: addDays(monthStart, -1) };
    }
  }
}

/** Presets del filtro "Fecha" del dashboard ADMIN, resueltos a fechas locales (YYYY-MM-DD). */
export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';

export const DATE_RANGE_PRESET_LABEL: Readonly<Record<DateRangePreset, string>> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7: 'Últimos 7 días',
  thisMonth: 'Este mes',
  lastMonth: 'Mes anterior',
};

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function resolveDateRange(preset: DateRangePreset, now = new Date()): { readonly from: string; readonly to: string } {
  switch (preset) {
    case 'today':
      return { from: toIsoDate(now), to: toIsoDate(now) };
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { from: toIsoDate(d), to: toIsoDate(d) };
    }
    case 'last7': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: toIsoDate(from), to: toIsoDate(now) };
    }
    case 'thisMonth':
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIsoDate(now) };
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toIsoDate(from), to: toIsoDate(to) };
    }
  }
}

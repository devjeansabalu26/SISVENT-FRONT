import { HourlyCell } from '../models/sales-report.model';

export const WEEKDAYS: readonly { readonly id: number; readonly short: string; readonly long: string }[] = [
  { id: 1, short: 'Lun', long: 'lunes' },
  { id: 2, short: 'Mar', long: 'martes' },
  { id: 3, short: 'Mié', long: 'miércoles' },
  { id: 4, short: 'Jue', long: 'jueves' },
  { id: 5, short: 'Vie', long: 'viernes' },
  { id: 6, short: 'Sáb', long: 'sábado' },
  { id: 7, short: 'Dom', long: 'domingo' },
];

export interface HeatmapCell {
  readonly hour: number;
  readonly transactions: number;
  readonly amount: number;
  readonly level: number;
}

export interface HeatmapRow {
  readonly weekday: number;
  readonly label: string;
  readonly cells: readonly HeatmapCell[];
  readonly amount: number;
}

export interface Heatmap {
  readonly hours: readonly number[];
  readonly rows: readonly HeatmapRow[];
  readonly peak: { readonly weekday: string; readonly hour: number; readonly transactions: number; readonly amount: number } | null;
  readonly strongestDay: { readonly label: string; readonly amount: number } | null;
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function buildHeatmap(cells: readonly HourlyCell[]): Heatmap {
  if (!cells.length) return { hours: [], rows: [], peak: null, strongestDay: null };
  const minHour = Math.min(...cells.map((cell) => cell.hour));
  const maxHour = Math.max(...cells.map((cell) => cell.hour));
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, index) => minHour + index);
  const maxTransactions = Math.max(...cells.map((cell) => cell.transactions), 1);
  const byKey = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell]));
  const rows = WEEKDAYS.map((day) => {
    const rowCells = hours.map((hour) => {
      const cell = byKey.get(`${day.id}-${hour}`);
      const transactions = cell?.transactions ?? 0;
      return {
        hour,
        transactions,
        amount: cell?.amount ?? 0,
        level: transactions === 0 ? 0 : Math.max(1, Math.ceil((transactions / maxTransactions) * 4)),
      };
    });
    return { weekday: day.id, label: day.short, cells: rowCells, amount: rowCells.reduce((sum, cell) => sum + cell.amount, 0) };
  });
  const top = [...cells].sort((a, b) => b.transactions - a.transactions || b.amount - a.amount)[0];
  const strongest = [...rows].sort((a, b) => b.amount - a.amount)[0];
  return {
    hours,
    rows,
    peak: { weekday: WEEKDAYS.find((day) => day.id === top.weekday)?.long ?? '', hour: top.hour, transactions: top.transactions, amount: top.amount },
    strongestDay: strongest.amount > 0 ? { label: WEEKDAYS.find((day) => day.id === strongest.weekday)?.long ?? '', amount: strongest.amount } : null,
  };
}

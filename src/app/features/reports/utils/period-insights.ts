import { currentRegional } from '../../../core/regional/regional-format';
import { DailyPoint, MetricDelta } from '../models/sales-report.model';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface WeekdayInsight {
  readonly label: string;
  readonly amount: number;
  readonly share: number;
}

export interface PeriodInsights {
  readonly days: number;
  readonly daysWithoutSales: number;
  readonly firstHalf: number;
  readonly secondHalf: number;
  readonly trendPercent: number | null;
  readonly bestWeekday: WeekdayInsight | null;
  readonly weakestDay: DailyPoint | null;
}

export interface MetricComparison {
  readonly current: number;
  readonly previous: number | null;
  readonly difference: number | null;
  readonly deltaPercent: number | null;
}

function dayIndex(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function localDate(instant: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
  } catch {
    return instant.toISOString().slice(0, 10);
  }
}

export function periodInsights(
  series: readonly DailyPoint[], from: string, to: string, timeZone: string = currentRegional().timezone,
): PeriodInsights {
  const start = dayIndex(localDate(new Date(from), timeZone));
  const end = Math.max(start, dayIndex(localDate(new Date(new Date(to).getTime() - 1), timeZone)));
  const days = Math.max(1, end - start + 1);
  const withSales = series.filter((point) => point.amount > 0);
  const middle = start + days / 2;
  const firstHalf = withSales.filter((point) => dayIndex(point.date) < middle).reduce((sum, point) => sum + point.amount, 0);
  const secondHalf = withSales.filter((point) => dayIndex(point.date) >= middle).reduce((sum, point) => sum + point.amount, 0);
  const total = firstHalf + secondHalf;

  const byWeekday = new Map<number, number>();
  for (const point of withSales) {
    const weekday = new Date(dayIndex(point.date) * 86_400_000).getUTCDay();
    byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + point.amount);
  }
  const best = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    days,
    daysWithoutSales: Math.max(0, days - new Set(withSales.map((point) => point.date.slice(0, 10))).size),
    firstHalf,
    secondHalf,
    trendPercent: days < 2 || firstHalf === 0 ? null : Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10,
    bestWeekday: best && total > 0 ? { label: WEEKDAYS[best[0]], amount: best[1], share: Math.round((best[1] / total) * 1000) / 10 } : null,
    weakestDay: withSales.length > 1 ? [...withSales].sort((a, b) => a.amount - b.amount)[0] : null,
  };
}

export function compareMetric(metric: MetricDelta): MetricComparison {
  if (metric.deltaPercent === null) return { current: metric.value, previous: null, difference: null, deltaPercent: null };
  if (metric.deltaPercent <= -100) return { current: metric.value, previous: null, difference: null, deltaPercent: metric.deltaPercent };
  const previous = metric.value / (1 + metric.deltaPercent / 100);
  const rounded = Math.round(previous * 100) / 100;
  return { current: metric.value, previous: rounded, difference: Math.round((metric.value - rounded) * 100) / 100, deltaPercent: metric.deltaPercent };
}

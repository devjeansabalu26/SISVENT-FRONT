import { Pipe, PipeTransform } from '@angular/core';
import {
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatDayMonthTime,
  formatMoney,
  formatTime,
  currentRegional,
  cashStep,
  formatQuantity,
  moneyStep,
  receiptNote,
} from '../../core/regional/regional-format';

export type RegionalText =
  | 'currencySymbol' | 'currencyCode' | 'taxName' | 'taxRatePercent' | 'taxIdName' | 'countryName'
  | 'receiptNote' | 'moneyStep' | 'cashStep';

@Pipe({ name: 'dateTime', pure: false })
export class DateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDateTime(value);
  }
}

@Pipe({ name: 'shortDate', pure: false })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDate(value);
  }
}

@Pipe({ name: 'localTime', pure: false })
export class LocalTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatTime(value);
  }
}

@Pipe({ name: 'dayMonthTime', pure: false })
export class DayMonthTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDayMonthTime(value);
  }
}

@Pipe({ name: 'calendarDate', pure: false })
export class CalendarDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatCalendarDate(value);
  }
}

@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatMoney(value);
  }
}

@Pipe({ name: 'compactMoney', pure: false })
export class CompactMoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    const regional = currentRegional();
    const amount = Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
    return `${regional.currencySymbol} ${amount}`;
  }
}

@Pipe({ name: 'regional', pure: false })
export class RegionalPipe implements PipeTransform {
  transform(key: RegionalText): string {
    const regional = currentRegional();
    switch (key) {
      case 'taxRatePercent':
        return `${Math.round(regional.taxRate * 10000) / 100} %`;
      case 'receiptNote':
        return receiptNote(regional);
      case 'moneyStep':
        return moneyStep(regional);
      case 'cashStep':
        return cashStep(regional);
      default:
        return String(regional[key]);
    }
  }
}

@Pipe({ name: 'quantity', pure: false })
export class QuantityPipe implements PipeTransform {
  transform(value: number | null | undefined, maxDecimals = 3): string {
    return formatQuantity(value, maxDecimals);
  }
}

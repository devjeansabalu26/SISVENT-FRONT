import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, formatDateTime } from '../utils/date-format';

/** "10/09/2026 04:31" — nunca un ISO crudo. Ver shared/utils/date-format.ts (formateo centralizado). */
@Pipe({ name: 'dateTime' })
export class DateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDateTime(value);
  }
}

/** "10/09/2026" (solo fecha). */
@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDate(value);
  }
}

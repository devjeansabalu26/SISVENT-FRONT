import { companyToday } from '../../core/regional/regional-format';

export { formatDate, formatDateTime } from '../../core/regional/regional-format';

export function localIsoDate(date: Date = new Date()): string {
  return companyToday(undefined, date);
}

import { AttendanceReport } from '../models/attendance.model';

export function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function reportTitle(report: AttendanceReport, storeName: string | null): string {
  return `Asistencia ${dateLabel(report.from)} al ${dateLabel(report.to)}${storeName ? ` · ${storeName}` : ''}`;
}

function dateLabel(value: string): string {
  return value.split('-').reverse().join('/');
}

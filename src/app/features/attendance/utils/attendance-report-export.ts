import { AttendanceReport } from '../models/attendance.model';
import { formatTime } from '../../../core/regional/regional-format';

const ROLE: Readonly<Record<string, string>> = { ADMIN: 'Administrador', VENDEDOR: 'Vendedor' };

export function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function reportTitle(report: AttendanceReport, storeName: string | null): string {
  return `Asistencia ${dateLabel(report.from)} al ${dateLabel(report.to)}${storeName ? ` · ${storeName}` : ''}`;
}

function dateLabel(value: string): string {
  return value.split('-').reverse().join('/');
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportCsv(report: AttendanceReport): string {
  const header = ['Persona', 'Rol', 'Usuario', 'Local', 'Días trabajados', 'Horas trabajadas', 'Minutos trabajados',
    'Tardanzas', 'Minutos de tardanza', 'Faltas', 'Salidas sin marcar'];
  const rows = report.rows.map((row) => [
    row.fullName, ROLE[row.role] ?? row.role, row.userCode ?? '', row.storeName ?? '', row.daysWorked,
    formatMinutes(row.workedMinutes), row.workedMinutes, row.lateDays, row.lateMinutes, row.absences, row.missingCheckOuts,
  ]);
  const names = new Map(report.rows.map((row) => [row.profileId, row.fullName]));
  const detailHeader = ['Persona', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Minutos de tardanza', 'Estado'];
  const detail = report.days.map((day) => [
    names.get(day.profileId) ?? '', dateLabel(day.date), day.firstCheckIn ? hour(day.firstCheckIn) : '',
    day.lastCheckOut ? hour(day.lastCheckOut) : '', formatMinutes(day.workedMinutes), day.lateMinutes,
    day.absent ? 'Falta' : day.missingCheckOut ? 'Sin salida' : day.lateMinutes > 0 ? 'Tardanza' : 'Asistió',
  ]);
  const lines = [
    [`Horario: ${report.workStart}-${report.workEnd}, tolerancia ${report.toleranceMinutes} min`],
    header, ...rows, [], ['Detalle por día'], detailHeader, ...detail,
  ];
  return '﻿' + lines.map((line) => line.map(csvCell).join(';')).join('\r\n');
}

function hour(value: string): string {
  return formatTime(value);
}

export async function reportPdf(report: AttendanceReport, title: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const columns = [
    { label: 'Persona', x: 12 }, { label: 'Rol', x: 82 }, { label: 'Usuario', x: 112 }, { label: 'Días', x: 135 },
    { label: 'Horas', x: 152 }, { label: 'Tardanzas', x: 185 }, { label: 'Min. tarde', x: 210 }, { label: 'Faltas', x: 235 },
    { label: 'Sin salida', x: 255 },
  ];
  doc.setFontSize(14);
  doc.text(title, 12, 15);
  doc.setFontSize(9);
  doc.text(`Horario: ${report.workStart} a ${report.workEnd} · tolerancia ${report.toleranceMinutes} min`, 12, 21);
  let y = 30;
  const head = (): void => {
    doc.setFont('helvetica', 'bold');
    columns.forEach((column) => doc.text(column.label, column.x, y));
    doc.setFont('helvetica', 'normal');
    doc.line(12, y + 2, 285, y + 2);
    y += 8;
  };
  head();
  for (const row of report.rows) {
    if (y > 195) {
      doc.addPage();
      y = 15;
      head();
    }
    const values = [row.fullName.slice(0, 38), ROLE[row.role] ?? row.role, row.userCode ?? '—', String(row.daysWorked),
      formatMinutes(row.workedMinutes), String(row.lateDays), String(row.lateMinutes), String(row.absences),
      String(row.missingCheckOuts)];
    values.forEach((value, index) => doc.text(value, columns[index].x, y));
    y += 7;
  }
  if (!report.rows.length) doc.text('Sin registros en el período.', 12, y);
  return doc.output('blob');
}

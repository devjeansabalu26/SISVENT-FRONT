import { AttendanceReport } from '../models/attendance.model';
import { formatMinutes, reportCsv, reportTitle } from './attendance-report-export';

describe('attendance-report-export', () => {
  const report: AttendanceReport = {
    from: '2026-10-12',
    to: '2026-10-16',
    workDays: '1,2,3,4,5',
    workStart: '09:00',
    workEnd: '16:00',
    toleranceMinutes: 10,
    rows: [
      {
        profileId: 'p1', fullName: 'Ana; Ruiz', role: 'VENDEDOR', userCode: '12345', storeName: 'Centro',
        daysWorked: 3, workedMinutes: 1230, lateDays: 1, lateMinutes: 30, absences: 2, missingCheckOuts: 1,
      },
    ],
    days: [
      { profileId: 'p1', date: '2026-10-15', firstCheckIn: null, lastCheckOut: null, workedMinutes: 0, lateMinutes: 0, absent: true, missingCheckOut: false },
    ],
  };

  it('formatea minutos como horas y minutos', () => {
    expect(formatMinutes(1230)).toBe('20 h 30 min');
    expect(formatMinutes(5)).toBe('0 h 05 min');
  });

  it('genera un CSV para Excel con BOM, punto y coma y texto escapado', () => {
    const csv = reportCsv(report);
    expect(csv.startsWith('﻿')).toBeTrue();
    expect(csv).toContain('"Ana; Ruiz";Vendedor;12345;Centro;3;20 h 30 min;1230;1;30;2;1');
    expect(csv).toContain('15/10/2026');
    expect(csv).toContain('Falta');
  });

  it('arma el título con el rango y el local', () => {
    expect(reportTitle(report, 'Centro')).toBe('Asistencia 12/10/2026 al 16/10/2026 · Centro');
    expect(reportTitle(report, null)).toBe('Asistencia 12/10/2026 al 16/10/2026');
  });
});

import { AttendanceReport } from '../models/attendance.model';
import { formatMinutes, reportTitle } from './attendance-report-export';

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

  it('arma el título con el rango y el local', () => {
    expect(reportTitle(report, 'Centro')).toBe('Asistencia 12/10/2026 al 16/10/2026 · Centro');
    expect(reportTitle(report, null)).toBe('Asistencia 12/10/2026 al 16/10/2026');
  });
});

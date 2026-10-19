import { formatTime } from '../../../core/regional/regional-format';

export type AttendanceAction = 'IN' | 'OUT';

export interface AttendancePerson {
  readonly recordId: string;
  readonly profileId: string;
  readonly fullName: string;
  readonly role: string;
  readonly userCode: string | null;
  readonly email: string | null;
  readonly checkInAt: string;
}

export interface AttendanceStatus {
  readonly enabled: boolean;
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly workDate: string;
  readonly currentProfileId: string | null;
  readonly present: readonly AttendancePerson[];
  readonly today: readonly AttendanceRecord[];
}

export interface AttendanceRecord {
  readonly id: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly profileId: string;
  readonly fullName: string;
  readonly role: string;
  readonly userCode: string | null;
  readonly workDate: string;
  readonly checkInAt: string;
  readonly checkOutAt: string | null;
  readonly autoClosed: boolean;
  readonly source: string;
  readonly notes: string | null;
  readonly version: number;
}

export interface AttendanceMarkResult {
  readonly action: AttendanceAction;
  readonly record: AttendanceRecord;
  readonly warning?: string | null;
}

export interface AttendanceReportRow {
  readonly profileId: string;
  readonly fullName: string;
  readonly role: string;
  readonly userCode: string | null;
  readonly storeName: string | null;
  readonly daysWorked: number;
  readonly workedMinutes: number;
  readonly lateDays: number;
  readonly lateMinutes: number;
  readonly absences: number;
  readonly missingCheckOuts: number;
}

export interface AttendanceReportDay {
  readonly profileId: string;
  readonly date: string;
  readonly firstCheckIn: string | null;
  readonly lastCheckOut: string | null;
  readonly workedMinutes: number;
  readonly lateMinutes: number;
  readonly absent: boolean;
  readonly missingCheckOut: boolean;
}

export interface AttendanceReport {
  readonly from: string;
  readonly to: string;
  readonly workDays: string;
  readonly workStart: string;
  readonly workEnd: string;
  readonly toleranceMinutes: number;
  readonly rows: readonly AttendanceReportRow[];
  readonly days: readonly AttendanceReportDay[];
}

export interface AttendanceAutoResult {
  readonly marked: boolean;
  readonly record: AttendanceRecord | null;
  readonly status: AttendanceStatus;
}

export interface AttendanceWorker {
  readonly profileId: string;
  readonly fullName: string;
  readonly role: string;
  readonly userCode: string | null;
  readonly storeId: string | null;
  readonly storeName: string | null;
}

export interface AttendanceStoreOption {
  readonly id: string;
  readonly name: string;
}

export interface SaveAttendanceBody {
  readonly profileId: string;
  readonly storeId: string;
  readonly checkInAt: string;
  readonly checkOutAt: string | null;
  readonly notes: string | null;
  readonly version?: number;
}

export function hourOf(value: string): string {
  return formatTime(value);
}

export const ROLE_LABELS: Readonly<Record<string, string>> = { ADMIN: 'Administrador', VENDEDOR: 'Vendedor' };

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
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const ROLE_LABELS: Readonly<Record<string, string>> = { ADMIN: 'Administrador', VENDEDOR: 'Vendedor' };

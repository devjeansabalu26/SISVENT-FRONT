export type AuditLevel = 'INFO' | 'WARNING' | 'ERROR';

/**
 * Mirrors AuditEntryResponse from GET /api/v1/audit, plus `companyName` which is
 * only present on the SUPERADMIN cross-company trail (GET /api/v1/platform/audit).
 */
export interface AuditEvent {
  readonly id: string;
  readonly createdAt: string;
  readonly actorName: string | null;
  readonly actorRole: string | null;
  readonly companyName?: string | null;
  readonly action: string;
  readonly entityName: string;
  readonly entityId: string | null;
  readonly level: AuditLevel;
  readonly detail: string | null;
  readonly ipAddress: string | null;
  /** Campos modificados (antes → después), calculados por el backend. */
  readonly changes?: readonly AuditChange[];
  /** Motivo escrito por el usuario (anulación, suspensión…). */
  readonly reason?: string | null;
}

export interface AuditChange {
  readonly field: string;
  readonly before: string;
  readonly after: string;
}

export interface AuditPage {
  readonly items: readonly AuditEvent[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

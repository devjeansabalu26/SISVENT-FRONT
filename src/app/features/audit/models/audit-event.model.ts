export type AuditLevel = 'INFO' | 'WARNING' | 'ERROR';

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
  readonly changes?: readonly AuditChange[];
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

export type NotificationPriority = 'ALTA' | 'MEDIA' | 'INFO' | 'SISTEMA';

/** Mirrors NotificationItem from /api/v1/notifications (prioridad y categoría las define el backend). */
export interface ApiNotification {
  readonly id: string;
  readonly type: string;
  readonly priority: NotificationPriority;
  readonly category: string;
  readonly title: string;
  readonly message: string;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly companyId: string | null;
  readonly companyName: string | null;
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface NotificationCounts {
  readonly all: number;
  readonly unread: number;
  readonly alerts: number;
  readonly critical: number;
  readonly updates: number;
  readonly system: number;
}

export interface NotificationList {
  readonly items: readonly ApiNotification[];
  readonly counts: NotificationCounts;
}

/** Acción contextual de una notificación ("Ver producto", "Ver empresa"…). */
export interface NotificationAction {
  readonly label: string;
  readonly route: readonly string[];
}

export interface NotificationItem extends ApiNotification {
  readonly timeAgo: string;
  readonly actions: readonly NotificationAction[];
}

/** Pestañas del backend: SUPERADMIN usa all/unread/alerts/system; ADMIN all/unread/critical/updates/system. */
export type NotificationTab = keyof NotificationCounts;

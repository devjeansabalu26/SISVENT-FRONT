export type NotificationPriority = 'ALTA' | 'MEDIA' | 'INFO' | 'SISTEMA';

export interface NotificationItem {
  readonly id: string;
  readonly priority: NotificationPriority;
  readonly category: string;
  readonly title: string;
  readonly body: string;
  readonly timeAgo: string;
  readonly read: boolean;
  readonly actions: readonly string[];
}

export type NotificationTab = 'all' | 'unread' | 'alerts' | 'system';

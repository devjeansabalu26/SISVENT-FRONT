import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { NOTIFICATION_MOCK } from '../data-access/notification.mock';
import { NotificationItem, NotificationTab } from '../models/notification-item.model';

@Component({
  selector: 'app-notifications-page',
  imports: [PageHeader, EmptyState],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  private readonly notifications = inject(NotificationService);

  readonly items = signal<readonly NotificationItem[]>(NOTIFICATION_MOCK);
  readonly activeTab = signal<NotificationTab>('all');

  readonly counts = computed(() => ({
    all: this.items().length,
    unread: this.items().filter((item) => !item.read).length,
    alerts: this.items().filter((item) => item.priority === 'ALTA' || item.priority === 'MEDIA').length,
    system: this.items().filter((item) => item.priority === 'SISTEMA').length,
  }));

  readonly tabs: readonly { readonly id: NotificationTab; readonly label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'No leídas' },
    { id: 'alerts', label: 'Alertas' },
    { id: 'system', label: 'Sistema' },
  ];

  readonly visible = computed(() => {
    const tab = this.activeTab();
    return this.items().filter((item) => {
      if (tab === 'unread') return !item.read;
      if (tab === 'alerts') return item.priority === 'ALTA' || item.priority === 'MEDIA';
      if (tab === 'system') return item.priority === 'SISTEMA';
      return true;
    });
  });

  countFor(tab: NotificationTab): number {
    return this.counts()[tab];
  }

  markRead(item: NotificationItem): void {
    if (item.read) return;
    this.items.update((rows) => rows.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
  }

  markAllRead(): void {
    this.items.update((rows) => rows.map((row) => ({ ...row, read: true })));
    this.notifications.show('Todas las notificaciones marcadas como leídas.', 'success');
  }
}

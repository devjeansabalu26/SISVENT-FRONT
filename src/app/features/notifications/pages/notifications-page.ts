import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { NotificationApiService } from '../data-access/notification-api.service';
import { NotificationBadgeService } from '../data-access/notification-badge.service';
import {
  ApiNotification,
  NotificationAction,
  NotificationCounts,
  NotificationItem,
  NotificationTab,
} from '../models/notification-item.model';

const EMPTY_COUNTS: NotificationCounts = { all: 0, unread: 0, alerts: 0, critical: 0, updates: 0, system: 0 };

export function timeAgo(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const time = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  if (hours < 48) return `Ayer, ${time}`;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

@Component({
  selector: 'app-notifications-page',
  imports: [PageHeader, EmptyState],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage implements OnInit {
  private readonly api = inject(NotificationApiService);
  private readonly badge = inject(NotificationBadgeService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly isSuperadmin = inject(UserContextService).user()?.role === 'SUPERADMIN';

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly items = signal<readonly NotificationItem[]>([]);
  readonly counts = signal<NotificationCounts>(EMPTY_COUNTS);
  readonly activeTab = signal<NotificationTab>('all');

  readonly tabs: readonly { readonly id: NotificationTab; readonly label: string }[] = this.isSuperadmin
    ? [
        { id: 'all', label: 'Todas' },
        { id: 'unread', label: 'No leídas' },
        { id: 'alerts', label: 'Alertas' },
        { id: 'system', label: 'Sistema' },
      ]
    : [
        { id: 'all', label: 'Todas' },
        { id: 'unread', label: 'No leídas' },
        { id: 'critical', label: 'Críticas' },
        { id: 'updates', label: 'Actualizaciones' },
        { id: 'system', label: 'Sistema' },
      ];

  readonly visible = computed(() => {
    const tab = this.activeTab();
    return this.items().filter((item) => {
      if (tab === 'unread') return !item.isRead;
      if (tab === 'alerts') return item.priority === 'ALTA' || item.priority === 'MEDIA';
      if (tab === 'critical') return item.priority === 'ALTA';
      if (tab === 'updates') return item.priority === 'INFO';
      if (tab === 'system') return item.priority === 'SISTEMA';
      return true;
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.list().subscribe({
      next: (list) => {
        const now = new Date();
        this.items.set(list.items.map((item) => ({ ...item, timeAgo: timeAgo(item.createdAt, now), actions: this.actionsFor(item) })));
        this.counts.set(list.counts);
        this.badge.set(list.counts.unread);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  countFor(tab: NotificationTab): number {
    return this.counts()[tab];
  }

  markRead(item: NotificationItem): void {
    if (item.isRead) return;
    this.setRead((row) => row.id === item.id);
    this.api.markRead(item.id).subscribe({
      error: () => {
        this.notifications.show('No se pudo marcar la notificación como leída.', 'error');
        this.load();
      },
    });
  }

  markAllRead(): void {
    if (!this.counts().unread) {
      this.notifications.show('No tienes notificaciones sin leer.', 'info');
      return;
    }
    this.api.markAllRead().subscribe({
      next: () => {
        this.setRead(() => true);
        this.notifications.show('Todas las notificaciones marcadas como leídas.', 'success');
      },
      error: () => this.notifications.show('No se pudieron marcar las notificaciones.', 'error'),
    });
  }

  open(item: NotificationItem, action: NotificationAction, event: Event): void {
    event.stopPropagation();
    this.markRead(item);
    void this.router.navigate(action.route);
  }

  private setRead(match: (row: NotificationItem) => boolean): void {
    let changed = 0;
    this.items.update((rows) =>
      rows.map((row) => {
        if (row.isRead || !match(row)) return row;
        changed++;
        return { ...row, isRead: true };
      }),
    );
    this.counts.update((counts) => ({ ...counts, unread: Math.max(0, counts.unread - changed) }));
    this.badge.set(this.counts().unread);
  }

  private actionsFor(item: ApiNotification): readonly NotificationAction[] {
    const id = item.referenceId;
    switch (item.referenceType) {
      case 'products':
        return id
          ? [
              { label: 'Ver producto', route: ['/app/products', id] },
              ...(item.type === 'LOW_STOCK' ? [{ label: 'Ir a inventario', route: ['/app/inventory'] }] : []),
            ]
          : [];
      case 'sales':
        return id ? [{ label: 'Ver venta', route: ['/app/sales', id] }] : [];
      case 'companies':
        return id ? [{ label: 'Ver empresa', route: ['/app/companies', id] }] : [];
      case 'plans':
      case 'company_plan_periods':
        if (this.isSuperadmin) return item.companyId ? [{ label: 'Ver empresa', route: ['/app/companies', item.companyId] }] : [];
        return [{ label: 'Ver mi plan', route: ['/app/plan'] }];
      default:
        return [];
    }
  }
}

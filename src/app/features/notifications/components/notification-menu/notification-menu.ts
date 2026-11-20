import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserContextService } from '../../../../core/context/user-context/user-context.service';
import { NotificationApiService } from '../../data-access/notification-api.service';
import { NotificationBadgeService } from '../../data-access/notification-badge.service';
import { ApiNotification } from '../../models/notification-item.model';
import { timeAgo } from '../../utils/time-ago';
import { notificationIcon, notificationRoute, notificationTone } from '../../utils/notification-icon';

const MENU_LIMIT = 8;

@Component({
  selector: 'app-notification-menu',
  imports: [RouterLink],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  templateUrl: './notification-menu.html',
  styleUrl: './notification-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMenu {
  private readonly api = inject(NotificationApiService);
  private readonly badge = inject(NotificationBadgeService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly superadmin = inject(UserContextService).user()?.role === 'SUPERADMIN';

  readonly unread = this.badge.unread;
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly items = signal<readonly ApiNotification[]>([]);
  readonly label = computed(() => (this.unread() ? `Notificaciones: ${this.unread()} sin leer` : 'Notificaciones'));

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.load();
  }

  close(): void {
    this.open.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  icon(item: ApiNotification): string {
    return notificationIcon(item);
  }

  tone(item: ApiNotification): string {
    return notificationTone(item.priority);
  }

  ago(item: ApiNotification): string {
    return timeAgo(item.createdAt);
  }

  openItem(item: ApiNotification): void {
    if (!item.isRead) {
      this.api.markRead(item.id).subscribe({ error: () => undefined });
      this.items.update((items) => items.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)));
      this.badge.set(this.unread() - 1);
    }
    this.close();
    void this.router.navigate(notificationRoute(item, this.superadmin));
  }

  markAll(): void {
    this.api.markAllRead().subscribe({
      next: () => {
        this.items.update((items) => items.map((row) => ({ ...row, isRead: true })));
        this.badge.set(0);
      },
      error: () => undefined,
    });
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.list(MENU_LIMIT).subscribe({
      next: (list) => {
        this.items.set(list.items);
        this.badge.set(list.counts.unread);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}

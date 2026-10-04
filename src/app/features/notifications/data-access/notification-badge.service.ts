import { Injectable, inject, signal } from '@angular/core';
import { NotificationApiService } from './notification-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly api = inject(NotificationApiService);
  private readonly count = signal(0);
  readonly unread = this.count.asReadonly();

  refresh(): void {
    this.api.unreadCount().subscribe({ next: (value) => this.count.set(value), error: () => undefined });
  }

  set(value: number): void {
    this.count.set(Math.max(0, value));
  }
}

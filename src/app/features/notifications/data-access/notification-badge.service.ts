import { Injectable, inject, signal } from '@angular/core';
import { NotificationApiService } from './notification-api.service';

/** Contador de no leídas compartido por la campana del header y el centro de notificaciones. */
@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly api = inject(NotificationApiService);
  private readonly count = signal(0);
  readonly unread = this.count.asReadonly();

  refresh(): void {
    // Silencioso: si falla (sin red, sesión vencida) la campana simplemente conserva el último valor.
    this.api.unreadCount().subscribe({ next: (value) => this.count.set(value), error: () => undefined });
  }

  set(value: number): void {
    this.count.set(Math.max(0, value));
  }
}

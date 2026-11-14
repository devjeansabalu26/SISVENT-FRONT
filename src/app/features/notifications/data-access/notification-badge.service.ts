import { Injectable, inject, signal } from '@angular/core';
import { NotificationApiService } from './notification-api.service';
import { SoundService } from '../../../core/sound/sound.service';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly api = inject(NotificationApiService);
  private readonly sound = inject(SoundService);
  private readonly count = signal(0);
  private loaded = false;
  readonly unread = this.count.asReadonly();

  refresh(): void {
    this.api.unreadCount().subscribe({
      next: (value) => {
        if (this.loaded && value > this.count()) this.sound.play('notification');
        this.loaded = true;
        this.count.set(value);
      },
      error: () => undefined,
    });
  }

  set(value: number): void {
    this.count.set(Math.max(0, value));
  }
}

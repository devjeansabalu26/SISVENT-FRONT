import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SoundService } from '../sound/sound.service';
import { SoundKind } from '../sound/sound.model';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'plan-limit' | 'permission-blocked';

const SOUND_BY_TYPE: Readonly<Record<NotificationType, SoundKind>> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
  'plan-limit': 'warning',
  'permission-blocked': 'error',
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly sound = inject(SoundService);
  private blockedUntil = 0;

  show(message: string, type: NotificationType = 'info'): void {
    if (type === 'error' && Date.now() < this.blockedUntil) return;
    if (type === 'permission-blocked') this.blockedUntil = Date.now() + 1500;
    this.sound.play(SOUND_BY_TYPE[type]);
    const persistent = type === 'error' || type === 'plan-limit' || type === 'permission-blocked';
    this.snackBar.open(message, 'Cerrar', {
      duration: persistent ? 10000 : 6500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification--${type}`],
    });
  }
}

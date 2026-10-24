import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'plan-limit' | 'permission-blocked';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private blockedUntil = 0;

  show(message: string, type: NotificationType = 'info'): void {
    if (type === 'error' && Date.now() < this.blockedUntil) return;
    if (type === 'permission-blocked') this.blockedUntil = Date.now() + 1500;
    const persistent = type === 'error' || type === 'plan-limit' || type === 'permission-blocked';
    this.snackBar.open(message, 'Cerrar', {
      duration: persistent ? 7000 : 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification--${type}`],
    });
  }
}

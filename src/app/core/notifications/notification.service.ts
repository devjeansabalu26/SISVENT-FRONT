import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'plan-limit' | 'permission-blocked';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string, type: NotificationType = 'info'): void {
    const persistent = type === 'error' || type === 'plan-limit' || type === 'permission-blocked';
    this.snackBar.open(message, 'Cerrar', {
      duration: persistent ? 7000 : 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification--${type}`],
    });
  }
}

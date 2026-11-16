import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';

const FALLBACK = 'Esta opción no se puede cambiar en este momento.';
const CONTROLS = 'input, select, textarea';
const REPEAT_MS = 1500;

export function lockedReason(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const locked = target.closest('[data-locked]');
  const reason = locked?.getAttribute('data-locked')?.trim();
  if (locked && reason && (locked.matches(':disabled') || locked.querySelector(':disabled, [aria-disabled="true"]'))) return reason;
  const control = target.closest(CONTROLS) ?? target.closest('label')?.querySelector(CONTROLS) ?? null;
  if (control instanceof HTMLElement && control.matches(':disabled') && control.closest('main, .cdk-overlay-container')) {
    if (control instanceof HTMLInputElement && control.type === 'file') return null;
    return FALLBACK;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class LockedControlService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(NotificationService);
  private started = false;
  private last = { message: '', at: 0 };

  private readonly notify = (event: Event): void => {
    const message = lockedReason(event.target);
    if (!message) return;
    const now = Date.now();
    if (message === this.last.message && now - this.last.at < REPEAT_MS) return;
    this.last = { message, at: now };
    this.zone.run(() => this.notifications.show(message, 'warning'));
  };

  start(): void {
    if (this.started) return;
    this.started = true;
    this.zone.runOutsideAngular(() => this.document.addEventListener('pointerdown', this.notify, true));
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.document.removeEventListener('pointerdown', this.notify, true);
  }
}

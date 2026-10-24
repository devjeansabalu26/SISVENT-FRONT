import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';
import { clearDemoActions, demoLockTarget, markDemoActions } from './demo-lock';

@Injectable({ providedIn: 'root' })
export class DemoLockService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(NotificationService);
  private observer: MutationObserver | null = null;
  private frame = 0;

  private readonly block = (event: Event): void => {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.type === 'submit' ? (event as SubmitEvent).submitter ?? this.lockedSubmit(event.target) : event.target;
    if (!demoLockTarget(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== 'submit') {
      this.zone.run(() => this.notifications.show('Modo demostración: esta acción está desactivada.', 'permission-blocked'));
    }
  };

  start(): void {
    if (this.observer) return;
    const body = this.document.body;
    this.zone.runOutsideAngular(() => {
      ['click', 'keydown', 'submit'].forEach((type) => this.document.addEventListener(type, this.block, true));
      this.observer = new MutationObserver(() => this.schedule());
      this.observer.observe(body, { childList: true, subtree: true, characterData: true });
      this.schedule();
    });
  }

  stop(): void {
    if (!this.observer) return;
    ['click', 'keydown', 'submit'].forEach((type) => this.document.removeEventListener(type, this.block, true));
    this.observer.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.frame);
    clearDemoActions(this.document.body);
  }

  private schedule(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => markDemoActions(this.document.body));
  }

  private lockedSubmit(form: EventTarget | null): Element | null {
    if (!(form instanceof HTMLFormElement)) return null;
    return form.querySelector('[type="submit"].demo-locked, button:not([type]).demo-locked');
  }
}

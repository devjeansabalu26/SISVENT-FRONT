import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/services/auth-api.service';
import { AppSessionService } from '../../../../core/auth/services/app-session.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AttendanceEntryPromptService } from '../../../attendance/utils/attendance-entry-prompt.service';
import { AlertBanner } from '../../../../shared/ui/alert-banner/alert-banner';
import { LoginAlert, loginAlertFor } from './login-alert';
import { LoginPreview } from '../../components/login-preview/login-preview';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, NgOptimizedImage, AlertBanner, LoginPreview],
  templateUrl: './login-page.html',
  host: { '(document:pointerdown)': 'markInteracted($event)', '(document:keydown)': 'markInteracted($event)' },
  styleUrls: ['./login-page.scss', './login-page.mobile.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AppSessionService);
  private readonly router = inject(Router);
  private readonly attendance = inject(AttendanceEntryPromptService);

  readonly hidePassword = signal(true);
  readonly capsLock = signal(false);
  readonly interacted = signal(false);

  markInteracted(event: Event): void {
    if (event.isTrusted && !this.interacted()) this.interacted.set(true);
  }

  trackCaps(event: Event): void {
    if (event instanceof KeyboardEvent && typeof event.getModifierState === 'function') {
      this.capsLock.set(event.getModifierState('CapsLock'));
    }
  }
  readonly tiltX = signal(0);
  readonly tiltY = signal(0);
  readonly glowX = signal(-999);
  readonly glowY = signal(-999);
  readonly now = signal(new Date());
  readonly today = computed(() => {
    const day = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(this.now());
    return day.charAt(0).toUpperCase() + day.slice(1);
  });
  readonly clock = computed(() =>
    new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' }).format(this.now()),
  );
  readonly submitting = signal(false);
  readonly error = signal<LoginAlert | null>(null);
  readonly welcome = signal<string | null>(null);

  readonly dots = Array.from({ length: 1200 }, () => ({
    duration: `${(4 + Math.random() * 4).toFixed(1)}s`,
    delay: `-${(Math.random() * 8).toFixed(1)}s`,
  }));

  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(\d{5}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    if (inject(AuthService).isAuthenticated()) {
      void this.router.navigateByUrl('/app/dashboard');
    }
    const timer = setInterval(() => this.now.set(new Date()), 20000);
    const warmup = setTimeout(() => void this.preloadHome(), 400);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      clearTimeout(warmup);
    });
  }

  tilt(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tiltX.set(Math.round(((event.clientX - box.left) / box.width) * 200 - 100) / 100);
    this.tiltY.set(Math.round(((event.clientY - box.top) / box.height) * 200 - 100) / 100);
  }

  glow(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.glowX.set(Math.round(event.clientX - box.left));
    this.glowY.set(Math.round(event.clientY - box.top));
  }

  resetGlow(): void {
    this.glowX.set(-999);
    this.glowY.set(-999);
  }

  resetTilt(): void {
    this.tiltX.set(0);
    this.tiltY.set(0);
  }

  private preloadHome(): Promise<unknown> {
    return Promise.all([
      import('../../../../layouts/main-layout/main-layout'),
      import('../../../dashboard/pages/dashboard-page'),
    ]).catch(() => undefined);
  }

  submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (result) => {
        let ready: Promise<void>;
        try {
          ready = this.session.start(result);
        } catch {
          this.submitting.set(false);
          this.error.set({
            tone: 'error',
            icon: 'error_outline',
            title: 'No se pudo iniciar la sesión',
            message: 'La cuenta no tiene un perfil válido para ingresar.',
          });
          return;
        }
        this.attendance.markOnNextEntry();
        this.welcome.set(result.user.firstName?.trim() ?? '');
        const minimum = new Promise<void>((resolve) => setTimeout(resolve, 700));
        void Promise.all([ready, minimum, this.preloadHome()]).then(() => this.router.navigateByUrl('/app/dashboard'));
      },
      error: (cause: unknown) => {
        this.submitting.set(false);
        this.error.set(loginAlertFor(cause));
      },
    });
  }
}

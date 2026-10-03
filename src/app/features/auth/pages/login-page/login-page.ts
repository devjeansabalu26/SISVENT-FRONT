import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/services/auth-api.service';
import { AppSessionService } from '../../../../core/auth/services/app-session.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AlertBanner } from '../../../../shared/ui/alert-banner/alert-banner';
import { LoginAlert, loginAlertFor } from './login-alert';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, AlertBanner],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AppSessionService);
  private readonly router = inject(Router);

  readonly hidePassword = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<LoginAlert | null>(null);

  // Puntos decorativos del panel: cada uno parpadea con su propia duración y desfase.
  readonly dots = Array.from({ length: 600 }, () => ({
    duration: `${(4 + Math.random() * 4).toFixed(1)}s`,
    delay: `-${(Math.random() * 8).toFixed(1)}s`,
  }));

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    if (inject(AuthService).isAuthenticated()) {
      void this.router.navigateByUrl('/app/dashboard');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (result) => {
        try {
          this.session.start(result);
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
        void this.router.navigateByUrl('/app/dashboard');
      },
      error: (cause: unknown) => {
        this.submitting.set(false);
        this.error.set(loginAlertFor(cause));
      },
    });
  }
}

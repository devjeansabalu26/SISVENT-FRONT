import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/services/auth-api.service';
import { AppSessionService } from '../../../../core/auth/services/app-session.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
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
  readonly error = signal<string | null>(null);

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
          this.error.set('No se pudo iniciar la sesión con esta cuenta.');
          return;
        }
        void this.router.navigateByUrl('/app/dashboard');
      },
      error: (cause: unknown) => {
        this.submitting.set(false);
        this.error.set(this.messageFor(cause));
      },
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 401) return 'Usuario o contraseña incorrectos.';
      if (cause.status === 403) return 'Tu cuenta no está habilitada para ingresar.';
      if (cause.status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
      if (cause.kind === 'network') return 'No fue posible conectar con el servidor.';
    }
    return 'No se pudo iniciar sesión. Inténtalo nuevamente.';
  }
}

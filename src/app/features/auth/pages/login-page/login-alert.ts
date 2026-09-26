import { HttpErrorResponse } from '@angular/common/http';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { AlertBannerTone } from '../../../../shared/ui/alert-banner/alert-banner';

export interface LoginAlert {
  readonly tone: AlertBannerTone;
  readonly icon: string;
  readonly title: string;
  readonly message: string;
}

/** Variantes de Figma `state-variations-canvas` (textos literales del diseño). */
export const LOGIN_ALERTS = {
  invalidCredentials: {
    tone: 'error',
    icon: 'gpp_bad',
    title: 'Credenciales inválidas',
    message: 'El correo electrónico o contraseña no coinciden con ningún usuario activo.',
  },
  userDisabled: {
    tone: 'warning',
    icon: 'warning_amber',
    title: 'Usuario desactivado',
    message: 'Tu acceso ha sido bloqueado por el administrador. Comunícate con soporte.',
  },
  companyExpired: {
    tone: 'error',
    icon: 'gpp_bad',
    title: 'Licencia de empresa vencida',
    message: 'La suscripción de tu organización ha expirado o está suspendida. Regulariza los pagos para reactivar el sistema.',
  },
  tooManyAttempts: {
    tone: 'warning',
    icon: 'timer',
    title: 'Demasiados intentos',
    message: 'Espera un momento e inténtalo de nuevo.',
  },
  network: {
    tone: 'error',
    icon: 'wifi_off',
    title: 'Sin conexión con el servidor',
    message: 'No fue posible conectar con el servidor. Verifica tu conexión.',
  },
  unexpected: {
    tone: 'error',
    icon: 'error_outline',
    title: 'No se pudo iniciar sesión',
    message: 'Inténtalo nuevamente.',
  },
} as const satisfies Record<string, LoginAlert>;

/**
 * El backend responde 403 con un `ProblemDetails` cuyo `title` describe el motivo
 * (`IdentityAuthService`). El único motivo de empresa es "La empresa o la vigencia del plan no
 * habilitan el acceso."; cualquier otro 403 es un problema de la cuenta del usuario.
 */
const COMPANY_REASON = /empresa|vigencia/i;

function problemTitle(cause: AppHttpError): string {
  const original = cause.originalError;
  if (!(original instanceof HttpErrorResponse)) return '';
  const body: unknown = original.error;
  return typeof body === 'object' && body !== null && 'title' in body && typeof body.title === 'string' ? body.title : '';
}

export function loginAlertFor(cause: unknown): LoginAlert {
  if (!(cause instanceof AppHttpError)) return LOGIN_ALERTS.unexpected;
  if (cause.status === 401) return LOGIN_ALERTS.invalidCredentials;
  if (cause.status === 403) return COMPANY_REASON.test(problemTitle(cause)) ? LOGIN_ALERTS.companyExpired : LOGIN_ALERTS.userDisabled;
  if (cause.status === 429) return LOGIN_ALERTS.tooManyAttempts;
  if (cause.kind === 'network') return LOGIN_ALERTS.network;
  return LOGIN_ALERTS.unexpected;
}

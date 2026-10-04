import { HttpErrorResponse } from '@angular/common/http';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { AlertBannerTone } from '../../../../shared/ui/alert-banner/alert-banner';

export interface LoginAlert {
  readonly tone: AlertBannerTone;
  readonly icon: string;
  readonly title: string;
  readonly message: string;
}

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
  companySuspended: {
    tone: 'error',
    icon: 'block',
    title: 'Empresa suspendida',
    message: 'El acceso de tu organización está suspendido. Comunícate con el equipo de SAVIX.',
  },
  companyInactive: {
    tone: 'warning',
    icon: 'domain_disabled',
    title: 'Empresa no activa',
    message: 'Tu organización todavía no está activa o fue desactivada. Comunícate con el equipo de SAVIX.',
  },
  planPending: {
    tone: 'info',
    icon: 'event',
    title: 'El plan aún no inicia',
    message: 'La vigencia del plan de tu organización empieza en una fecha posterior.',
  },
  accountLocked: {
    tone: 'warning',
    icon: 'lock_clock',
    title: 'Cuenta bloqueada temporalmente',
    message: 'Se superó el número de intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
  },
  storeDisabled: {
    tone: 'warning',
    icon: 'store',
    title: 'Local no habilitado',
    message: 'El local asignado a tu usuario está desactivado. Pide a tu administrador que lo revise.',
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

const ALERT_BY_CODE: Readonly<Record<string, LoginAlert>> = {
  INVALID_CREDENTIALS: LOGIN_ALERTS.invalidCredentials,
  ACCOUNT_DISABLED: LOGIN_ALERTS.userDisabled,
  ACCOUNT_LOCKED: LOGIN_ALERTS.accountLocked,
  INVALID_ROLE: LOGIN_ALERTS.userDisabled,
  TWO_FACTOR_REQUIRED: LOGIN_ALERTS.userDisabled,
  STORE_DISABLED: LOGIN_ALERTS.storeDisabled,
  COMPANY_SUSPENDED: LOGIN_ALERTS.companySuspended,
  COMPANY_INACTIVE: LOGIN_ALERTS.companyInactive,
  PLAN_EXPIRED: LOGIN_ALERTS.companyExpired,
  PLAN_MISSING: LOGIN_ALERTS.companyExpired,
  PLAN_PENDING: LOGIN_ALERTS.planPending,
  COMPANY_ACCESS_DENIED: LOGIN_ALERTS.companyExpired,
};

const COMPANY_REASON = /empresa|vigencia/i;

function problemField(cause: AppHttpError, field: 'title' | 'code'): string {
  const original = cause.originalError;
  if (!(original instanceof HttpErrorResponse)) return '';
  const body: unknown = original.error;
  if (typeof body !== 'object' || body === null || !(field in body)) return '';
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

export function loginAlertFor(cause: unknown): LoginAlert {
  if (!(cause instanceof AppHttpError)) return LOGIN_ALERTS.unexpected;
  if (cause.status === 401) return LOGIN_ALERTS.invalidCredentials;
  if (cause.status === 403) {
    const byCode = ALERT_BY_CODE[problemField(cause, 'code')];
    if (byCode) return byCode;
    return COMPANY_REASON.test(problemField(cause, 'title')) ? LOGIN_ALERTS.companyExpired : LOGIN_ALERTS.userDisabled;
  }
  if (cause.status === 429) return LOGIN_ALERTS.tooManyAttempts;
  if (cause.kind === 'network') return LOGIN_ALERTS.network;
  return LOGIN_ALERTS.unexpected;
}

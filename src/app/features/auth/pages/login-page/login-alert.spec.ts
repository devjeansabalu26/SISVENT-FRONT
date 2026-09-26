import { HttpErrorResponse } from '@angular/common/http';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { LOGIN_ALERTS, loginAlertFor } from './login-alert';

function forbidden(title: string): AppHttpError {
  const original = new HttpErrorResponse({ status: 403, error: { status: 403, title } });
  return new AppHttpError('forbidden', 403, 'x', original);
}

describe('loginAlertFor', () => {
  it('401 → credenciales inválidas', () => {
    expect(loginAlertFor(new AppHttpError('unauthorized', 401, 'x'))).toBe(LOGIN_ALERTS.invalidCredentials);
  });

  it('403 por empresa o vigencia → licencia vencida', () => {
    expect(loginAlertFor(forbidden('La empresa o la vigencia del plan no habilitan el acceso.'))).toBe(LOGIN_ALERTS.companyExpired);
  });

  it('403 por la cuenta → usuario desactivado', () => {
    expect(loginAlertFor(forbidden('El usuario no está habilitado.'))).toBe(LOGIN_ALERTS.userDisabled);
    expect(loginAlertFor(new AppHttpError('forbidden', 403, 'x'))).toBe(LOGIN_ALERTS.userDisabled);
  });

  it('errores no HTTP → genérico', () => {
    expect(loginAlertFor(new Error('boom'))).toBe(LOGIN_ALERTS.unexpected);
  });
});

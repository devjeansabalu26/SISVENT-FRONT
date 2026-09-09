import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppHttpError, HttpErrorKind } from '../models/app-http-error.model';

const ERROR_MESSAGES: Readonly<Record<HttpErrorKind, string>> = {
  validation: 'Revisa los datos ingresados e inténtalo nuevamente.',
  unauthorized: 'Tu sesión no es válida o ha expirado.',
  forbidden: 'No tienes permiso para realizar esta acción.',
  'not-found': 'No se encontró el recurso solicitado.',
  conflict: 'La operación entra en conflicto con el estado actual.',
  server: 'Ocurrió un error inesperado en el servidor.',
  network: 'No fue posible conectar con el servidor.',
  unexpected: 'Ocurrió un error inesperado.',
};

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  normalize(error: unknown): AppHttpError {
    if (!(error instanceof HttpErrorResponse)) {
      return new AppHttpError('unexpected', 0, ERROR_MESSAGES.unexpected, error);
    }

    const kind = this.resolveKind(error.status);
    return new AppHttpError(kind, error.status, ERROR_MESSAGES[kind], error);
  }

  private resolveKind(status: number): HttpErrorKind {
    if (status === 0) return 'network';
    if (status === 400 || status === 422) return 'validation';
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not-found';
    if (status === 409) return 'conflict';
    if (status >= 500) return 'server';
    return 'unexpected';
  }
}

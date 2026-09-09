export type HttpErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'network'
  | 'unexpected';

export class AppHttpError extends Error {
  constructor(
    readonly kind: HttpErrorKind,
    readonly status: number,
    message: string,
    readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'AppHttpError';
  }
}

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../../config/app-config.token';
import { AUTH_TOKEN_PROVIDER } from '../constants/auth-token-provider.token';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(APP_CONFIG).apiBaseUrl;

  if (apiBaseUrl && !request.url.startsWith(apiBaseUrl)) {
    return next(request);
  }

  const token = inject(AUTH_TOKEN_PROVIDER, { optional: true })?.getToken();
  if (!token) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

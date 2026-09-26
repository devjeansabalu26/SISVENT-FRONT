import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { HttpErrorService } from '../services/http-error.service';
import { HANDLE_FORBIDDEN_INLINE } from '../http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const errors = inject(HttpErrorService);
  const router = inject(Router);

  // The login page renders auth failures inline; don't hijack its navigation.
  const isAuthRequest = request.url.includes('/api/v1/auth/');

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isAuthRequest) {
        if (error.status === 401) {
          auth.markUnauthenticated();
          void router.navigateByUrl('/login');
        } else if (error.status === 403 && !request.context.get(HANDLE_FORBIDDEN_INLINE)) {
          void router.navigateByUrl('/403');
        }
      }

      return throwError(() => errors.normalize(error));
    }),
  );
};

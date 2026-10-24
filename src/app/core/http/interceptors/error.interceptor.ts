import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { HttpErrorService } from '../services/http-error.service';
import { HANDLE_FORBIDDEN_INLINE } from '../http-context.tokens';
import { NotificationService } from '../../notifications/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const errors = inject(HttpErrorService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  const isAuthRequest = request.url.includes('/api/v1/auth/');

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isAuthRequest) {
        if (error.status === 401) {
          auth.markUnauthenticated();
          void router.navigateByUrl('/login');
        } else if (error.status === 403 && (error.error as { code?: unknown } | null)?.code === 'READ_ONLY_USER') {
          notifications.show('Modo demostración: puedes ver la información, pero no guardar cambios.', 'permission-blocked');
        } else if (error.status === 403 && !request.context.get(HANDLE_FORBIDDEN_INLINE)) {
          void router.navigateByUrl('/403');
        }
      }

      return throwError(() => errors.normalize(error));
    }),
  );
};

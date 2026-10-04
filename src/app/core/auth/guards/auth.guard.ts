import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppSessionService } from '../services/app-session.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  inject(AppSessionService).restore();
  const router = inject(Router);
  const status = auth.status();

  if (status === 'authenticated') {
    return true;
  }

  return status === 'unauthenticated' ? router.createUrlTree(['/login']) : false;
};

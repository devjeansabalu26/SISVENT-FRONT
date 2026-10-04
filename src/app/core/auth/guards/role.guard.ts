import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserContextService } from '../../context/user-context/user-context.service';
import { isAppRole } from '../constants/app-role.constant';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = inject(UserContextService).user();
  const configuredRoles: unknown = route.data['roles'];

  if (auth.status() === 'pending') {
    return false;
  }

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const roles = Array.isArray(configuredRoles) ? configuredRoles.filter(isAppRole) : [];
  return user && roles.includes(user.role) ? true : router.createUrlTree(['/403']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MAIN_NAVIGATION } from '../../../layouts/main-layout/navigation/navigation.config';
import { APP_PERMISSIONS } from '../constants/app-permission.constant';
import { AccessControlService } from '../services/access-control.service';

export const homeGuard: CanActivateFn = () => {
  const access = inject(AccessControlService);
  const router = inject(Router);
  if (access.canAccess({ permissions: [APP_PERMISSIONS.dashboardView] })) return true;
  const first = MAIN_NAVIGATION.find(
    (item) =>
      item.route !== '/app/dashboard' &&
      access.canAccess({ roles: item.roles, permissions: item.permissions, plans: item.plans }) &&
      (!item.requiredFeature || access.hasFeature(item.requiredFeature)),
  );
  return router.createUrlTree([first?.route ?? '/403']);
};

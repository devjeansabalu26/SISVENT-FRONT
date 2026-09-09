import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppPermission } from '../constants/app-permission.constant';
import { AccessControlService } from '../services/access-control.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permissions = (route.data['permissions'] ?? []) as readonly AppPermission[];
  return inject(AccessControlService).canAccess({ permissions })
    ? true
    : inject(Router).createUrlTree(['/403']);
};

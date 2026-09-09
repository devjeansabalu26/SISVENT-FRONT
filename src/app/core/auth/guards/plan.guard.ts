import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyPlan } from '../../context/company-context/company-plan.model';
import { AccessControlService } from '../services/access-control.service';

export const planGuard: CanActivateFn = (route) => {
  const plans = (route.data['plans'] ?? []) as readonly CompanyPlan[];
  return inject(AccessControlService).canAccess({ plans })
    ? true
    : inject(Router).createUrlTree(['/403']);
};

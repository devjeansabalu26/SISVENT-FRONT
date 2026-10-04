import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyPlan } from '../../context/company-context/company-plan.model';
import { AccessControlService } from '../services/access-control.service';

export const planGuard: CanActivateFn = (route) => {
  const access = inject(AccessControlService);
  const router = inject(Router);
  const plans = (route.data['plans'] ?? []) as readonly CompanyPlan[];
  const requiredFeature = route.data['requiredFeature'] as string | undefined;

  if (requiredFeature && !access.hasFeature(requiredFeature)) {
    return router.createUrlTree(['/app/upgrade'], {
      queryParams: { feature: requiredFeature, module: route.data['title'] ?? null },
    });
  }
  return access.canAccess({ plans }) ? true : router.createUrlTree(['/403']);
};

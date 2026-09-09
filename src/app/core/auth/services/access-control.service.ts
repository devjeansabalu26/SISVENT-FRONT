import { Injectable, inject } from '@angular/core';
import { AppPermission } from '../constants/app-permission.constant';
import { AppRole } from '../constants/app-role.constant';
import { CompanyContextService } from '../../context/company-context/company-context.service';
import { CompanyPlan } from '../../context/company-context/company-plan.model';
import { UserContextService } from '../../context/user-context/user-context.service';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly users = inject(UserContextService);
  private readonly companies = inject(CompanyContextService);

  canAccess(requirement: { roles?: readonly AppRole[]; permissions?: readonly AppPermission[]; plans?: readonly CompanyPlan[] }): boolean {
    const user = this.users.user();
    if (!user) return false;
    if (requirement.roles?.length && !requirement.roles.includes(user.role)) return false;
    if (requirement.permissions?.length && !requirement.permissions.every((permission) => user.permissions.includes(permission))) return false;
    const plan = this.companies.company()?.plan;
    return !requirement.plans?.length || (!!plan && requirement.plans.includes(plan));
  }
}

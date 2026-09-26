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

  canAccess(requirement: {
    roles?: readonly AppRole[];
    permissions?: readonly AppPermission[];
    plans?: readonly CompanyPlan[];
    /** Códigos de features reales del plan vigente (plan_features/features), p.ej. 'PRODUCTS'. */
    features?: readonly string[];
  }): boolean {
    const user = this.users.user();
    if (!user) return false;
    if (requirement.roles?.length && !requirement.roles.includes(user.role)) return false;
    if (requirement.permissions?.length && !requirement.permissions.every((permission) => user.permissions.includes(permission))) return false;
    const company = this.companies.company();
    if (requirement.plans?.length && !(company && requirement.plans.includes(company.plan))) return false;
    if (requirement.features?.length && !requirement.features.every((feature) => this.hasFeature(feature))) return false;
    return true;
  }

  /**
   * ¿El plan vigente incluye la funcionalidad? El SUPERADMIN (sin empresa) no depende de un plan.
   * Es solo para la interfaz: el backend vuelve a validarlo en cada petición.
   */
  hasFeature(feature: string): boolean {
    if (this.users.user()?.role === 'SUPERADMIN') return true;
    return this.companies.company()?.features.includes(feature) ?? false;
  }

  /** Cumple rol y permisos, pero su plan no incluye la funcionalidad (se muestra con candado). */
  isLockedByPlan(requirement: { roles?: readonly AppRole[]; permissions?: readonly AppPermission[]; feature?: string }): boolean {
    return !!requirement.feature
      && this.canAccess({ roles: requirement.roles, permissions: requirement.permissions })
      && !this.hasFeature(requirement.feature);
  }
}

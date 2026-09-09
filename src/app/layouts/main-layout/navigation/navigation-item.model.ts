import { AppRole } from '../../../core/auth/constants/app-role.constant';
import { AppPermission } from '../../../core/auth/constants/app-permission.constant';
import { CompanyPlan } from '../../../core/context/company-context/company-plan.model';

export interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  /** Optional sidebar section heading (Figma groups: Operaciones, Catálogo, Almacén, …). */
  readonly group?: string;
  readonly roles?: readonly AppRole[];
  readonly permissions?: readonly AppPermission[];
  readonly plans?: readonly CompanyPlan[];
  readonly children?: readonly NavigationItem[];
}

export interface NavigationGroup {
  readonly label: string | null;
  readonly items: readonly NavigationItem[];
}

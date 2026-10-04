import { AppRole } from '../../../core/auth/constants/app-role.constant';
import { AppPermission } from '../../../core/auth/constants/app-permission.constant';
import { CompanyPlan } from '../../../core/context/company-context/company-plan.model';

export interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly group?: string;
  readonly roles?: readonly AppRole[];
  readonly permissions?: readonly AppPermission[];
  readonly plans?: readonly CompanyPlan[];
  readonly requiredFeature?: string;
  readonly children?: readonly NavigationItem[];
}

export interface SidebarItem extends NavigationItem {
  readonly locked: boolean;
}

export interface NavigationGroup {
  readonly label: string | null;
  readonly items: readonly SidebarItem[];
}

import { AppRole } from '../../auth/constants/app-role.constant';
import { AppPermission } from '../../auth/constants/app-permission.constant';

export interface UserContext {
  readonly userId: string;
  readonly displayName: string;
  readonly role: AppRole;
  readonly permissions: readonly AppPermission[];
  readonly avatarUrl?: string;
  readonly branchId?: string;
  readonly branchName?: string;
  readonly canViewAllStores?: boolean;
  readonly visibleStores?: readonly { readonly id: string; readonly name: string }[];
}

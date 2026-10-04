import { ModuleLevel } from '../../../core/auth/constants/module-permissions.constant';

export interface SellerModule {
  readonly code: string;
  readonly label: string;
  readonly group: string;
  readonly supportsManage: boolean;
  readonly availableInCompany: boolean;
  readonly level: ModuleLevel | null;
}

export interface SellerModules {
  readonly userId: string;
  readonly customized: boolean;
  readonly modules: readonly SellerModule[];
}

export interface UpdateSellerModules {
  readonly useDefaults: boolean;
  readonly modules: readonly { readonly code: string; readonly level: ModuleLevel }[];
}

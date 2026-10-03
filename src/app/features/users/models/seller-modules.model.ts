import { ModuleLevel } from '../../../core/auth/constants/module-permissions.constant';

/** `GET/PUT /api/v1/users/{id}/modules` (ADMIN): menús de un vendedor. */
export interface SellerModule {
  readonly code: string;
  readonly label: string;
  readonly group: string;
  readonly supportsManage: boolean;
  /** Activo en la empresa (lo decide el SUPERADMIN dentro del plan); si no, no se puede asignar. */
  readonly availableInCompany: boolean;
  /** null = sin acceso. */
  readonly level: ModuleLevel | null;
}

export interface SellerModules {
  readonly userId: string;
  /** false = usa los menús por defecto del vendedor. */
  readonly customized: boolean;
  readonly modules: readonly SellerModule[];
}

export interface UpdateSellerModules {
  readonly useDefaults: boolean;
  readonly modules: readonly { readonly code: string; readonly level: ModuleLevel }[];
}

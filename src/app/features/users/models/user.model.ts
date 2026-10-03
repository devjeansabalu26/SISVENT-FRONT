/** Mirrors UserListItem from GET /api/v1/users (ADMIN, scoped to their company). */
export interface AppUser {
  /** VENDEDOR autorizado a consultar otros locales. */
  readonly canViewAllStores?: boolean;
  /** Usuario de acceso: código de 5 dígitos (null si aún no fue migrado). */
  readonly userCode?: string | null;
  readonly id: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: 'ADMIN' | 'VENDEDOR';
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
}

export interface UserRoleLimit {
  readonly sellersUsed: number;
  readonly sellersMax: number | null;
  readonly adminsUsed: number;
  readonly adminsMax: number | null;
  readonly planName: string | null;
}

export interface UserListResponse {
  readonly items: readonly AppUser[];
  readonly limits: UserRoleLimit;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface UserDetail {
  /** Usuario de acceso: código de 5 dígitos (null si aún no fue migrado). */
  readonly userCode?: string | null;
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: 'ADMIN' | 'VENDEDOR';
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
  readonly createdAt: string;
}

export interface CreateUserResponse {
  readonly user: UserDetail;
  readonly temporaryPassword: string;
}

export interface ResetAccessResponse {
  /** Usuario de acceso: código de 5 dígitos (null si aún no fue migrado). */
  readonly userCode?: string | null;
  readonly temporaryPassword: string;
  readonly forceChange: boolean;
}

export interface UserFormValue {
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: 'ADMIN' | 'VENDEDOR';
  readonly storeId: string | null;
  /** VENDEDOR: puede consultar productos y stock de otros locales (solo lectura). */
  readonly canViewAllStores?: boolean;
}

/** Mirrors PlatformUserDetailResponse from GET /api/v1/platform/users/{id} (SUPERADMIN, cross-company, read only). */
export interface PlatformUserDetail {
  /** Usuario de acceso: código de 5 dígitos (null si aún no fue migrado). */
  readonly userCode?: string | null;
  readonly profileId: string;
  readonly identityUserId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: string;
  readonly companyId: string;
  readonly companyName: string | null;
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
  readonly createdAt: string;
}

/** Mirrors PlatformUserItem from GET /api/v1/platform/users (SUPERADMIN, cross-company, read only here). */
export interface PlatformUserItem {
  /** Usuario de acceso: código de 5 dígitos (null si aún no fue migrado). */
  readonly userCode?: string | null;
  readonly profileId: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: string;
  readonly companyId: string | null;
  readonly companyName: string | null;
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
}

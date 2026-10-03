import { SessionModule } from '../constants/module-permissions.constant';

/** Contracts for POST /api/v1/auth/login and GET /api/v1/auth/me. */

export interface LoginCredentials {
  /** Código de 5 dígitos (ADMIN/VENDEDOR) o correo (SUPERADMIN). */
  readonly username: string;
  readonly password: string;
}

/** Empresa del usuario autenticado (ADMIN/VENDEDOR): nombre, plan vigente, features habilitadas por
 * ese plan y el theme visual guardado. `null` para SUPERADMIN (no pertenece a ninguna empresa). */
export interface SessionCompany {
  readonly id: string;
  readonly tradeName: string;
  readonly planCode: string | null;
  readonly planName: string | null;
  readonly features: readonly string[];
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly accentColor: string | null;
  readonly backgroundColor: string | null;
  /** Menús efectivos del usuario con su nivel (ausente en backends anteriores a los menús configurables). */
  readonly modules?: readonly SessionModule[];
}

/** Session user as returned by the backend (login payload and /me body). */
export interface SessionUser {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly role: string;
  readonly companyId: string | null;
  readonly storeId: string | null;
  /** Nombre del local asignado. */
  readonly storeName?: string | null;
  /** VENDEDOR autorizado por el ADMIN a consultar otros locales. */
  readonly canViewAllStores?: boolean;
  readonly visibleStores?: readonly { readonly id: string; readonly name: string }[];
  readonly company: SessionCompany | null;
}

export interface LoginResult {
  readonly accessToken: string;
  /** null = el token no expira (backend sin Jwt:AccessTokenMinutes); la sesión termina con "Cerrar sesión". */
  readonly expiresAt: string | null;
  readonly user: SessionUser;
}

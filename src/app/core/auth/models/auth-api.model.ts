/** Contracts for POST /api/v1/auth/login and GET /api/v1/auth/me. */

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
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
}

export interface LoginResult {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly user: SessionUser;
}

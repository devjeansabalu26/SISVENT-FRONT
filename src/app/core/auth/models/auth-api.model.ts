import { SessionModule } from '../constants/module-permissions.constant';

export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

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
  readonly modules?: readonly SessionModule[];
}

export interface SessionUser {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly role: string;
  readonly companyId: string | null;
  readonly storeId: string | null;
  readonly storeName?: string | null;
  readonly canViewAllStores?: boolean;
  readonly visibleStores?: readonly { readonly id: string; readonly name: string }[];
  readonly company: SessionCompany | null;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly expiresAt: string | null;
  readonly user: SessionUser;
}

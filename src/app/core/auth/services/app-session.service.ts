import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompanyContextService } from '../../context/company-context/company-context.service';
import { UserContextService } from '../../context/user-context/user-context.service';
import { ThemeService } from '../../theme/theme.service';
import { isAppRole } from '../constants/app-role.constant';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.constant';
import { LoginResult, SessionUser } from '../models/auth-api.model';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

/**
 * Owns the authenticated session lifecycle: it exchanges a stored JWT for the
 * current profile via /auth/me on startup, applies the login result, and clears
 * everything on logout. The token in {@link TokenStorageService} is the single
 * source of truth; profile/company data is always re-fetched from the backend.
 */
@Injectable({ providedIn: 'root' })
export class AppSessionService {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly token = inject(TokenStorageService);
  private readonly users = inject(UserContextService);
  private readonly companies = inject(CompanyContextService);
  private readonly theme = inject(ThemeService);

  /** Runs during app initialization, before the router activates any route. */
  async bootstrap(): Promise<void> {
    if (!this.token.getToken()) {
      this.auth.markUnauthenticated();
      return;
    }

    try {
      this.applyProfile(await firstValueFrom(this.authApi.me()));
      this.auth.markAuthenticated();
    } catch {
      this.clear();
    }
  }

  /** Called by the login page once credentials are accepted. */
  start(result: LoginResult): void {
    this.token.set(result.accessToken, result.expiresAt);
    try {
      this.applyProfile(result.user);
    } catch (error) {
      this.clear();
      throw error;
    }
    this.auth.markAuthenticated();
  }

  clear(): void {
    this.token.clear();
    this.users.clear();
    this.companies.clear();
    this.theme.reset();
    this.auth.markUnauthenticated();
  }

  /** Kept for the synchronous {@link authGuard}; bootstrap already did the work. */
  restore(): boolean {
    return this.auth.isAuthenticated();
  }

  private applyProfile(user: SessionUser): void {
    if (!isAppRole(user.role)) {
      throw new Error(`Rol de usuario no reconocido: ${user.role}`);
    }

    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email || 'Usuario SISVENT';
    this.users.set({
      userId: user.id,
      displayName,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
      branchId: user.storeId ?? undefined,
    });

    if (user.companyId && user.company) {
      this.companies.set({
        companyId: user.companyId,
        commercialName: user.company.tradeName,
        plan: user.company.planCode ?? '',
        features: user.company.features,
      });
      this.theme.applyCompanyTheme({
        primary: user.company.primaryColor,
        secondary: user.company.secondaryColor,
        accent: user.company.accentColor,
        background: user.company.backgroundColor,
      });
    } else {
      // SUPERADMIN (o una empresa sin contexto todavía resuelto): sin tenant, sin theme propio —
      // se usa el theme por defecto de SISVENT (fallback real, no un tema "de otra empresa" residual).
      this.companies.clear();
      this.theme.reset();
    }
  }
}

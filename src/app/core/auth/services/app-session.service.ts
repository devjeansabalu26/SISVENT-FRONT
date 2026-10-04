import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, retry, throwError, timer } from 'rxjs';
import { CompanyContextService } from '../../context/company-context/company-context.service';
import { UserContextService } from '../../context/user-context/user-context.service';
import { ThemeService } from '../../theme/theme.service';
import { isAppRole } from '../constants/app-role.constant';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.constant';
import { permissionsFromModules } from '../constants/module-permissions.constant';
import { LoginResult, SessionUser } from '../models/auth-api.model';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { TOKEN_KEY, TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AppSessionService {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly token = inject(TokenStorageService);
  private readonly users = inject(UserContextService);
  private readonly companies = inject(CompanyContextService);
  private readonly theme = inject(ThemeService);
  private readonly injector = inject(Injector);

  constructor() {
    inject(DOCUMENT).defaultView?.addEventListener('storage', (event) => {
      if (event.key === TOKEN_KEY && !event.newValue && this.auth.isAuthenticated()) {
        this.clear();
        void this.injector.get(Router).navigateByUrl('/login');
      }
    });
  }

  async bootstrap(): Promise<void> {
    if (!this.token.getToken()) {
      this.auth.markUnauthenticated();
      return;
    }

    try {
      this.applyProfile(await firstValueFrom(this.authApi.me().pipe(retry({ count: 5, delay: retryUnlessRejected }))));
      this.auth.markAuthenticated();
    } catch (cause: unknown) {
      if (isRejected(cause)) this.clear();
      else this.auth.markUnauthenticated();
    }
  }

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

  restore(): boolean {
    return this.auth.isAuthenticated();
  }

  private applyProfile(user: SessionUser): void {
    if (!isAppRole(user.role)) {
      throw new Error(`Rol de usuario no reconocido: ${user.role}`);
    }

    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email || 'Usuario SAVIX';
    this.users.set({
      userId: user.id,
      displayName,
      role: user.role,
      permissions: user.role !== 'SUPERADMIN' && user.company?.modules
        ? permissionsFromModules(user.company.modules)
        : ROLE_PERMISSIONS[user.role],
      branchId: user.storeId ?? undefined,
      branchName: user.storeName ?? undefined,
      canViewAllStores: user.canViewAllStores ?? false,
      visibleStores: user.visibleStores ?? [],
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
      this.companies.clear();
      this.theme.reset();
    }
  }
}

function isRejected(cause: unknown): boolean {
  const status = (cause as { status?: unknown } | null)?.status;
  return status === 401 || status === 403;
}

function retryUnlessRejected(cause: unknown): Observable<number> {
  return isRejected(cause) ? throwError(() => cause) : timer(2000);
}

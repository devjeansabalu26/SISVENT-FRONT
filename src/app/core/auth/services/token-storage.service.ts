import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { AuthTokenProvider } from '../models/auth-token-provider.model';

export const TOKEN_KEY = 'sisvent.access_token';
const EXPIRES_KEY = 'sisvent.access_token_expires';

/**
 * Holds the JWT access token. Backed by localStorage: the session survives closing the tab or the
 * browser and ends only with "Cerrar sesión" (or when a configured expiration passes). An expired
 * token is discarded on read so callers never send a stale credential; a token without expiration
 * (expiresAt null) lives until logout.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService implements AuthTokenProvider {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly storage = this.window?.localStorage ?? null;

  constructor() {
    this.migrateFromSessionStorage();
  }

  getToken(): string | null {
    const token = this.storage?.getItem(TOKEN_KEY) ?? null;
    if (!token) return null;

    const expiresAt = this.storage?.getItem(EXPIRES_KEY);
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      this.clear();
      return null;
    }
    return token;
  }

  set(token: string, expiresAt: string | null): void {
    this.storage?.setItem(TOKEN_KEY, token);
    if (expiresAt) this.storage?.setItem(EXPIRES_KEY, expiresAt);
    else this.storage?.removeItem(EXPIRES_KEY);
  }

  clear(): void {
    this.storage?.removeItem(TOKEN_KEY);
    this.storage?.removeItem(EXPIRES_KEY);
  }

  /** Sesiones abiertas antes del cambio (sessionStorage) se conservan: se mueven una vez a localStorage. */
  private migrateFromSessionStorage(): void {
    const legacy = this.window?.sessionStorage;
    const token = legacy?.getItem(TOKEN_KEY);
    if (!legacy || !token) return;
    if (!this.storage?.getItem(TOKEN_KEY)) this.set(token, legacy.getItem(EXPIRES_KEY));
    legacy.removeItem(TOKEN_KEY);
    legacy.removeItem(EXPIRES_KEY);
  }
}

import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { AuthTokenProvider } from '../models/auth-token-provider.model';

const TOKEN_KEY = 'sisvent.access_token';
const EXPIRES_KEY = 'sisvent.access_token_expires';

/**
 * Holds the JWT access token for the current browser session.
 * Backed by sessionStorage, matching {@link AppSessionService}. An expired
 * token is discarded on read so callers never send a stale credential; a token
 * without expiration (expiresAt null) lives until logout.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService implements AuthTokenProvider {
  private readonly storage = inject(DOCUMENT).defaultView?.sessionStorage ?? null;

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
}

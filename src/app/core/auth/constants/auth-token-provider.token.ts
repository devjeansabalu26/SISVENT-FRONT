import { InjectionToken } from '@angular/core';
import { AuthTokenProvider } from '../models/auth-token-provider.model';

/** Implement when the backend authentication and token storage contracts are defined. */
export const AUTH_TOKEN_PROVIDER = new InjectionToken<AuthTokenProvider>('AUTH_TOKEN_PROVIDER');

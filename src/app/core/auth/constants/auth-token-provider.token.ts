import { InjectionToken } from '@angular/core';
import { AuthTokenProvider } from '../models/auth-token-provider.model';

export const AUTH_TOKEN_PROVIDER = new InjectionToken<AuthTokenProvider>('AUTH_TOKEN_PROVIDER');

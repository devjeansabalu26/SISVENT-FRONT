import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH_TOKEN_PROVIDER } from './core/auth/constants/auth-token-provider.token';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AppSessionService } from './core/auth/services/app-session.service';
import { TokenStorageService } from './core/auth/services/token-storage.service';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';
import { loadingInterceptor } from './core/http/interceptors/loading.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])),
    { provide: AUTH_TOKEN_PROVIDER, useExisting: TokenStorageService },
    provideAppInitializer(() => inject(AppSessionService).bootstrap()),
  ],
};

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AUTH_TOKEN_PROVIDER } from './core/auth/constants/auth-token-provider.token';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AppSessionService } from './core/auth/services/app-session.service';
import { TokenStorageService } from './core/auth/services/token-storage.service';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';
import { loadingInterceptor } from './core/http/interceptors/loading.interceptor';
import { routes } from './app.routes';
import { NativeControlsEnhancer } from './shared/ui/pickers/native-controls-enhancer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])),
    { provide: AUTH_TOKEN_PROVIDER, useExisting: TokenStorageService },
    provideAppInitializer(() => inject(AppSessionService).bootstrap()),
    provideAppInitializer(() => inject(NativeControlsEnhancer).start()),
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ...new MatDialogConfig(), maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100dvh - 32px)' },
    },
  ],
};

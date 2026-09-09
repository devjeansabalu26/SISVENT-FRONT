import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppConfig } from './app-config.model';

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => environment,
});

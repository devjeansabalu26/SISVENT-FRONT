import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { CompanySettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/settings`;

  get(): Observable<CompanySettings> {
    return this.http.get<CompanySettings>(this.baseUrl);
  }

  update(request: CompanySettings): Observable<CompanySettings> {
    return this.http.put<CompanySettings>(this.baseUrl, request);
  }
}

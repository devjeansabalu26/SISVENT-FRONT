import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { CompanyProfile, UpdateCompanyProfile } from '../models/company-profile.model';

@Injectable({ providedIn: 'root' })
export class CompanyProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/company/profile`;

  get(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(this.baseUrl);
  }

  update(body: UpdateCompanyProfile): Observable<CompanyProfile> {
    return this.http.put<CompanyProfile>(this.baseUrl, body);
  }

  uploadLogo(file: File): Observable<{ readonly logoUrl: string | null }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ readonly logoUrl: string | null }>(`${this.baseUrl}/logo`, form);
  }

  removeLogo(): Observable<{ readonly logoUrl: string | null }> {
    return this.http.delete<{ readonly logoUrl: string | null }>(`${this.baseUrl}/logo`);
  }
}

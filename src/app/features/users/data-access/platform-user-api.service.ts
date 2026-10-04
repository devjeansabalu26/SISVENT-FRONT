import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { PlatformUserDetail, PlatformUserItem } from '../models/user.model';

interface ListParams {
  readonly search?: string;
  readonly role?: string;
  readonly companyId?: string;
  readonly storeId?: string;
  readonly isActive?: boolean;
  readonly pageNumber?: number;
  readonly pageSize?: number;
}

interface PlatformUserPage {
  readonly items: readonly PlatformUserItem[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface PlatformResetAccessResponse {
  readonly userCode?: string | null;
  readonly temporaryPassword: string;
  readonly forceChange: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlatformUserApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/platform/users`;

  list(params: ListParams = {}): Observable<PlatformUserPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', Math.min(params.pageSize ?? 20, 100));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.companyId) httpParams = httpParams.set('companyId', params.companyId);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<PlatformUserPage>(this.baseUrl, { params: httpParams });
  }

  get(profileId: string): Observable<PlatformUserDetail> {
    return this.http.get<PlatformUserDetail>(`${this.baseUrl}/${profileId}`);
  }

  resetAccess(profileId: string): Observable<PlatformResetAccessResponse> {
    return this.http.post<PlatformResetAccessResponse>(`${this.baseUrl}/${profileId}/reset-access`, null);
  }

  setStatus(profileId: string, active: boolean, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${profileId}/status`, { active, reason });
  }
}

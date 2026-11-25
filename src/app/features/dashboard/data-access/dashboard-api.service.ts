import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { backgroundRequest } from '../../../core/http/http-context.tokens';
import { DashboardResponse, PlatformDashboardResponse, StoresTodayResponse } from '../models/dashboard.model';

export interface DashboardFilters {
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly storeId?: string;
  readonly sellerId?: string;
  readonly summary?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

  get(filters: DashboardFilters = {}): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.storeId) params = params.set('storeId', filters.storeId);
    if (filters.sellerId) params = params.set('sellerId', filters.sellerId);
    if (filters.summary) params = params.set('summary', 'true');
    return this.http.get<DashboardResponse>(`${this.baseUrl}/api/v1/dashboard`, { params });
  }

  sellers(storeId?: string): Observable<readonly { id: string; fullName: string }[]> {
    const params: Record<string, string> = storeId ? { storeId } : {};
    return this.http.get<readonly { id: string; fullName: string }[]>(`${this.baseUrl}/api/v1/dashboard/sellers`, { params, context: backgroundRequest() });
  }

  storesToday(): Observable<StoresTodayResponse> {
    return this.http.get<StoresTodayResponse>(`${this.baseUrl}/api/v1/dashboard/stores-today`, { context: backgroundRequest() });
  }

  platform(): Observable<PlatformDashboardResponse> {
    return this.http.get<PlatformDashboardResponse>(`${this.baseUrl}/api/v1/platform/dashboard`);
  }
}

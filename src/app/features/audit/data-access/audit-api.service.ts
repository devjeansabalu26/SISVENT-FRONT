import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AuditPage } from '../models/audit-event.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly action?: string;
  readonly entityName?: string;
  readonly level?: string;
  readonly companyId?: string;
  readonly from?: string;
  readonly to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_CONFIG).apiBaseUrl;
  private readonly userContext = inject(UserContextService);

  list(params: ListParams = {}): Observable<AuditPage> {
    // SUPERADMIN has no company, so the tenant-scoped /audit (ADMIN-only) returns 403.
    // The cross-company trail lives at /platform/audit (same shape + companyName).
    const isPlatform = this.userContext.user()?.role === 'SUPERADMIN';
    const url = `${this.apiBaseUrl}/api/v1/${isPlatform ? 'platform/audit' : 'audit'}`;
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 20);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.entityName) httpParams = httpParams.set('entityName', params.entityName);
    if (params.level) httpParams = httpParams.set('level', params.level);
    if (params.companyId && isPlatform) httpParams = httpParams.set('companyId', params.companyId);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<AuditPage>(url, { params: httpParams });
  }
}

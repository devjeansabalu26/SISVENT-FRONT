import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { SalesReport } from '../models/sales-report.model';

interface ReportParams {
  readonly from?: string;
  readonly to?: string;
  readonly storeId?: string;
  readonly topCount?: number;
}

@Injectable({ providedIn: 'root' })
export class SalesReportApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/reports/sales`;

  get(params: ReportParams = {}): Observable<SalesReport> {
    let httpParams = new HttpParams();
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.topCount) httpParams = httpParams.set('topCount', params.topCount);
    return this.http.get<SalesReport>(this.baseUrl, { params: httpParams });
  }
}

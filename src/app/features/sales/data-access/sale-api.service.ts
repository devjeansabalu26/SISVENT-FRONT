import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { SaleDetail } from '../models/sale-detail.model';
import { SalePage } from '../models/sale.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly from?: string;
  readonly to?: string;
  readonly clientId?: string;
  readonly storeId?: string;
  readonly paymentMethod?: string;
  readonly status?: string;
  readonly mineOnly?: boolean;
  readonly scope?: 'MINE' | 'STORE';
}

@Injectable({ providedIn: 'root' })
export class SaleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/sales`;

  list(params: ListParams = {}): Observable<SalePage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.clientId) httpParams = httpParams.set('clientId', params.clientId);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.mineOnly !== undefined) httpParams = httpParams.set('mineOnly', params.mineOnly);
    if (params.scope) httpParams = httpParams.set('scope', params.scope);
    return this.http.get<SalePage>(this.baseUrl, { params: httpParams });
  }

  get(id: string): Observable<SaleDetail> {
    return this.http.get<SaleDetail>(`${this.baseUrl}/${id}`);
  }

  sendReceipt(id: string, email: string, pdfBase64: string): Observable<{ readonly email: string; readonly sentAt: string }> {
    return this.http.post<{ readonly email: string; readonly sentAt: string }>(`${this.baseUrl}/${id}/send-receipt`, { email, pdfBase64 });
  }

  cancel(id: string, reason: string): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}

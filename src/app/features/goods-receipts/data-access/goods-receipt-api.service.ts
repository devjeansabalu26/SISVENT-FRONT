import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  GoodsReceiptCreateValue,
  GoodsReceiptDetail,
  GoodsReceiptPage,
  GoodsReceiptSummary,
} from '../models/goods-receipt.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly supplierId?: string;
  readonly status?: string;
}

@Injectable({ providedIn: 'root' })
export class GoodsReceiptApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/goods-receipts`;

  list(params: ListParams = {}): Observable<GoodsReceiptPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.supplierId) httpParams = httpParams.set('supplierId', params.supplierId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<GoodsReceiptPage>(this.baseUrl, { params: httpParams });
  }

  summary(): Observable<GoodsReceiptSummary> {
    return this.http.get<GoodsReceiptSummary>(`${this.baseUrl}/summary`);
  }

  get(id: string): Observable<GoodsReceiptDetail> {
    return this.http.get<GoodsReceiptDetail>(`${this.baseUrl}/${id}`);
  }

  create(body: GoodsReceiptCreateValue): Observable<GoodsReceiptDetail> {
    return this.http.post<GoodsReceiptDetail>(this.baseUrl, body);
  }
}

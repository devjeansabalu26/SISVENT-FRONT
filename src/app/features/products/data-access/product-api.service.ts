import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  Product,
  ProductCreateValue,
  ProductDetail,
  ProductPage,
  ProductPriceHistoryItem,
  ProductUpdateValue,
} from '../models/product.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly categoryId?: string;
  readonly brandId?: string;
  readonly storeId?: string | null;
  readonly isActive?: boolean;
  readonly lowStock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/products`;

  list(params: ListParams = {}): Observable<ProductPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.brandId) httpParams = httpParams.set('brandId', params.brandId);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    if (params.lowStock !== undefined) httpParams = httpParams.set('lowStock', params.lowStock);
    return this.http.get<ProductPage>(this.baseUrl, { params: httpParams });
  }

  get(id: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.baseUrl}/${id}`);
  }

  priceHistory(id: string): Observable<readonly ProductPriceHistoryItem[]> {
    return this.http.get<readonly ProductPriceHistoryItem[]>(`${this.baseUrl}/${id}/price-history`);
  }

  create(body: ProductCreateValue): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(this.baseUrl, body);
  }

  update(id: string, body: ProductUpdateValue): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }

  activate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, null, { params });
  }
}

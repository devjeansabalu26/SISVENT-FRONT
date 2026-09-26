import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Brand, BrandFormValue, BrandPage } from '../models/brand.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BrandApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/brands`;

  list(params: ListParams = {}): Observable<BrandPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<BrandPage>(this.baseUrl, { params: httpParams });
  }

  create(body: BrandFormValue): Observable<Brand> {
    return this.http.post<Brand>(this.baseUrl, body);
  }

  update(id: string, body: BrandFormValue & { readonly version: number }): Observable<Brand> {
    return this.http.put<Brand>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}

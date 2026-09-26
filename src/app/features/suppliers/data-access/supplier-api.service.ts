import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Supplier, SupplierFormValue, SupplierPage } from '../models/supplier.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupplierApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/suppliers`;

  list(params: ListParams = {}): Observable<SupplierPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<SupplierPage>(this.baseUrl, { params: httpParams });
  }

  get(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  create(body: SupplierFormValue): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, body);
  }

  update(id: string, body: SupplierFormValue & { readonly version: number }): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  CustomerDetail,
  CustomerFormValue,
  CustomerPage,
  CustomerSummary,
} from '../models/customer.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly type?: 'PERSON' | 'COMPANY';
  readonly isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/clients`;

  list(params: ListParams = {}): Observable<CustomerPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<CustomerPage>(this.baseUrl, { params: httpParams });
  }

  summary(): Observable<CustomerSummary> {
    return this.http.get<CustomerSummary>(`${this.baseUrl}/summary`);
  }

  get(id: string): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${this.baseUrl}/${id}`);
  }

  create(body: CustomerFormValue): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(this.baseUrl, body);
  }

  update(id: string, body: CustomerFormValue & { readonly version: number }): Observable<CustomerDetail> {
    return this.http.put<CustomerDetail>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}

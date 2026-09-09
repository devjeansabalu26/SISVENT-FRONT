import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Category, CategoryFormValue, CategoryPage } from '../models/category.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/categories`;

  list(params: ListParams = {}): Observable<CategoryPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<CategoryPage>(this.baseUrl, { params: httpParams });
  }

  create(body: CategoryFormValue): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, body);
  }

  update(id: string, body: CategoryFormValue & { readonly version: number }): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Store, StoreFormValue, StoreListResponse } from '../models/local.model';

@Injectable({ providedIn: 'root' })
export class StoreApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/stores`;

  list(): Observable<StoreListResponse> {
    return this.http.get<StoreListResponse>(this.baseUrl);
  }

  get(id: string): Observable<Store> {
    return this.http.get<Store>(`${this.baseUrl}/${id}`);
  }

  create(body: StoreFormValue): Observable<Store> {
    return this.http.post<Store>(this.baseUrl, body);
  }

  update(id: string, body: StoreFormValue & { readonly version: number }): Observable<Store> {
    return this.http.put<Store>(`${this.baseUrl}/${id}`, body);
  }

  activate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, null, { params });
  }

  deactivate(id: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', version);
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, null, { params });
  }
}

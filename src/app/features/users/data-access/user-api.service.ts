import { SellerModules, UpdateSellerModules } from '../models/seller-modules.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  CreateUserResponse,
  ResetAccessResponse,
  UserDetail,
  UserFormValue,
  UserListResponse,
} from '../models/user.model';

interface ListParams {
  readonly search?: string;
  readonly role?: string;
  readonly storeId?: string;
  readonly isActive?: boolean;
  readonly pageNumber?: number;
  readonly pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/users`;

  list(params: ListParams = {}): Observable<UserListResponse> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 20);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    return this.http.get<UserListResponse>(this.baseUrl, { params: httpParams });
  }

  getModules(id: string): Observable<SellerModules> {
    return this.http.get<SellerModules>(`${this.baseUrl}/${id}/modules`);
  }

  updateModules(id: string, body: UpdateSellerModules): Observable<SellerModules> {
    return this.http.put<SellerModules>(`${this.baseUrl}/${id}/modules`, body);
  }

  get(id: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.baseUrl}/${id}`);
  }

  create(body: UserFormValue): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.baseUrl, body);
  }

  update(id: string, body: UserFormValue): Observable<UserDetail> {
    return this.http.put<UserDetail>(`${this.baseUrl}/${id}`, body);
  }

  activate(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, null);
  }

  resetAccess(id: string): Observable<ResetAccessResponse> {
    return this.http.post<ResetAccessResponse>(`${this.baseUrl}/${id}/reset-access`, null);
  }
}

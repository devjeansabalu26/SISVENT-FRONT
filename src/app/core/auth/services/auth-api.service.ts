import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config.token';
import { LoginCredentials, LoginResult, SessionUser } from '../models/auth-api.model';

/** Thin client for the backend authentication endpoints. */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/auth`;

  login(credentials: LoginCredentials): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.baseUrl}/login`, credentials);
  }

  me(): Observable<SessionUser> {
    return this.http.get<SessionUser>(`${this.baseUrl}/me`);
  }
}

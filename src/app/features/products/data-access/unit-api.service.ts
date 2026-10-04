import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';

export interface UnitOption {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly isActive: boolean;
}

interface UnitPage {
  readonly items: readonly UnitOption[];
}

@Injectable({ providedIn: 'root' })
export class UnitApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/units`;

  list(): Observable<UnitPage> {
    const params = new HttpParams().set('pageNumber', 1).set('pageSize', 100).set('isActive', true);
    return this.http.get<UnitPage>(this.baseUrl, { params });
  }
}

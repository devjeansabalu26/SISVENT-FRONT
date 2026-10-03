import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';

/** Mirrors /api/v1/cash-closures (Sisvent.Application.CashClosures). */
export interface CashMethodTotal {
  readonly code: string;
  readonly name: string;
  readonly amount: number;
}

export interface CashClosure {
  readonly id: string;
  readonly storeId: string;
  readonly storeName: string;
  /** `YYYY-MM-DD` */
  readonly businessDate: string;
  readonly salesCount: number;
  readonly totalSales: number;
  readonly expectedCash: number;
  readonly expectedOther: number;
  readonly countedCash: number;
  readonly difference: number;
  readonly notes: string | null;
  readonly closedBy: string;
  readonly createdAt: string;
}

export interface CashClosurePreview {
  readonly storeId: string;
  readonly storeName: string;
  readonly businessDate: string;
  readonly salesCount: number;
  readonly totalSales: number;
  readonly expectedCash: number;
  readonly expectedOther: number;
  readonly byMethod: readonly CashMethodTotal[];
  /** Cierre ya registrado para ese local y día (no se puede volver a cerrar). */
  readonly existing: CashClosure | null;
}

@Injectable({ providedIn: 'root' })
export class CashClosureApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/cash-closures`;

  preview(storeId?: string | null, date?: string | null): Observable<CashClosurePreview> {
    let params = new HttpParams();
    if (storeId) params = params.set('storeId', storeId);
    if (date) params = params.set('date', date);
    return this.http.get<CashClosurePreview>(`${this.baseUrl}/preview`, { params });
  }

  close(body: { storeId: string; businessDate: string; countedCash: number; notes: string | null }): Observable<CashClosure> {
    return this.http.post<CashClosure>(this.baseUrl, body);
  }

  list(filters: { storeId?: string; from?: string; to?: string } = {}): Observable<readonly CashClosure[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
    return this.http.get<readonly CashClosure[]>(this.baseUrl, { params });
  }
}

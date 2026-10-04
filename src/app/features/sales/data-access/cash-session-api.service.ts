import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { handleForbiddenInline } from '../../../core/http/http-context.tokens';
import { CashMethodTotal } from './cash-closure-api.service';

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export interface CashSession {
  readonly id: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly status: CashSessionStatus;
  readonly openedByProfileId: string;
  readonly openedByUserId: string;
  readonly openedBy: string;
  readonly openedAt: string;
  readonly openingAmount: number;
  readonly closedBy: string | null;
  readonly closedAt: string | null;
  readonly salesCount: number;
  readonly totalSales: number;
  readonly totalRefunds: number;
  readonly expectedCash: number;
  readonly expectedOther: number;
  readonly countedCash: number | null;
  readonly difference: number | null;
  readonly notes: string | null;
  readonly forced: boolean;
  readonly forceReason: string | null;
  readonly byMethod: readonly CashMethodTotal[];
}

export interface CashSessionSale {
  readonly id: string;
  readonly saleNumber: string;
  readonly saleDate: string;
  readonly clientName: string | null;
  readonly sellerName: string;
  readonly paymentMethod: string;
  readonly total: number;
  readonly status: string;
}

export interface CashSessionRefund {
  readonly id: string;
  readonly creditNoteNumber: string;
  readonly issuedAt: string;
  readonly saleNumber: string;
  readonly refundMethod: string;
  readonly total: number;
  readonly createdBy: string;
}

export interface CashSessionDetail {
  readonly session: CashSession;
  readonly sales: readonly CashSessionSale[];
  readonly refunds: readonly CashSessionRefund[];
}

export interface StoreCashStatus {
  readonly storeId: string;
  readonly storeName: string;
  readonly current: CashSession | null;
  readonly pendingSales: number;
}

export function cashErrorMessage(cause: unknown, fallback: string): string {
  const body = cause instanceof AppHttpError
    ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
    : undefined;
  return typeof body?.title === 'string' && !body.errors ? body.title : fallback;
}

@Injectable({ providedIn: 'root' })
export class CashSessionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/cash-sessions`;
  private readonly context = handleForbiddenInline();

  status(): Observable<readonly StoreCashStatus[]> {
    return this.http.get<readonly StoreCashStatus[]>(`${this.baseUrl}/status`, { context: this.context });
  }

  list(filters: { storeId?: string; from?: string; to?: string } = {}): Observable<readonly CashSession[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
    return this.http.get<readonly CashSession[]>(this.baseUrl, { params, context: this.context });
  }

  get(id: string): Observable<CashSessionDetail> {
    return this.http.get<CashSessionDetail>(`${this.baseUrl}/${id}`, { context: this.context });
  }

  open(body: { storeId: string | null; openingAmount: number }): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.baseUrl}/open`, body, { context: this.context });
  }

  close(id: string, body: { countedCash: number; notes: string | null; reason: string | null }): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.baseUrl}/${id}/close`, body, { context: this.context });
  }
}

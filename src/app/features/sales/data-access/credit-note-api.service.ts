import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { handleForbiddenInline } from '../../../core/http/http-context.tokens';

/** Mirrors /api/v1/sales/{id}/credit-notes y /api/v1/credit-notes (Sisvent.Application.CreditNotes). */
export interface CreditNoteLineAvailability {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly sold: number;
  readonly returned: number;
  readonly available: number;
  /** Precio neto por unidad (descuentos incluidos). */
  readonly unitPrice: number;
}

export interface CreditNoteListItem {
  readonly id: string;
  readonly creditNoteNumber: string;
  readonly issuedAt: string;
  readonly saleId: string;
  readonly saleNumber: string;
  readonly storeName: string;
  readonly clientName: string | null;
  readonly refundMethod: string;
  readonly total: number;
  readonly reason: string;
  readonly createdBy: string;
}

export interface CreditNoteLine {
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

export interface CreditNoteDetail {
  readonly note: CreditNoteListItem;
  readonly lines: readonly CreditNoteLine[];
}

export interface SaleCreditSummary {
  readonly saleId: string;
  readonly saleNumber: string;
  readonly status: string;
  readonly saleTotal: number;
  readonly creditedTotal: number;
  /** La venta quedó en una caja cerrada: ya no se puede anular. */
  readonly cashClosed: boolean;
  readonly cancellable: boolean;
  readonly canIssue: boolean;
  readonly issueBlockedReason: string | null;
  readonly lines: readonly CreditNoteLineAvailability[];
  readonly creditNotes: readonly CreditNoteListItem[];
}

export interface CreateCreditNote {
  readonly reason: string;
  readonly refundMethod: string;
  readonly lines: readonly { productId: string; quantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class CreditNoteApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1`;
  private readonly context = handleForbiddenInline();

  summary(saleId: string): Observable<SaleCreditSummary> {
    return this.http.get<SaleCreditSummary>(`${this.baseUrl}/sales/${saleId}/credit-notes/summary`, { context: this.context });
  }

  create(saleId: string, body: CreateCreditNote): Observable<CreditNoteDetail> {
    return this.http.post<CreditNoteDetail>(`${this.baseUrl}/sales/${saleId}/credit-notes`, body, { context: this.context });
  }

  list(filters: { search?: string; from?: string; to?: string } = {}): Observable<readonly CreditNoteListItem[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
    return this.http.get<readonly CreditNoteListItem[]>(`${this.baseUrl}/credit-notes`, { params, context: this.context });
  }

  get(id: string): Observable<CreditNoteDetail> {
    return this.http.get<CreditNoteDetail>(`${this.baseUrl}/credit-notes/${id}`, { context: this.context });
  }
}

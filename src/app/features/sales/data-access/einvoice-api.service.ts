import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';

export interface EInvoiceListItem {
  readonly id: string;
  readonly saleId: string;
  readonly kind: 'FACTURA' | 'NOTA_CREDITO';
  readonly number: string;
  readonly saleNumber: string;
  readonly issuedAt: string;
  readonly customerTaxId: string;
  readonly customerName: string;
  readonly total: number;
  readonly status: string;
  readonly attempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly providerCode: string | null;
  readonly environment: string | null;
  readonly credentialSource: 'PROPIA' | 'GENERAL' | null;
  readonly pdfUrl: string | null;
  readonly xmlUrl: string | null;
  readonly cdrUrl: string | null;
}

export interface EInvoiceStatusCount {
  readonly kind: 'FACTURA' | 'NOTA_CREDITO';
  readonly status: string;
  readonly count: number;
}

export interface EInvoicePage {
  readonly items: readonly EInvoiceListItem[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly counts: readonly EInvoiceStatusCount[];
  readonly providerConfigured: boolean;
}

@Injectable({ providedIn: 'root' })
export class EInvoiceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/einvoices`;

  list(params: { readonly status?: string; readonly kind?: string; readonly pageNumber?: number; readonly pageSize?: number }): Observable<EInvoicePage> {
    let httpParams = new HttpParams().set('pageNumber', params.pageNumber ?? 1).set('pageSize', params.pageSize ?? 50);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.kind) httpParams = httpParams.set('kind', params.kind);
    return this.http.get<EInvoicePage>(this.baseUrl, { params: httpParams });
  }

  retry(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/retry`, {});
  }
}

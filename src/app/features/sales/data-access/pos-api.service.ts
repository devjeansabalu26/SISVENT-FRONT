import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { SaleDetail } from '../models/sale-detail.model';

export interface PosSaleLineInput {
  readonly productId: string;
  readonly quantity: number;
  readonly discountAmount: number;
}

export interface PosSaleRequest {
  readonly storeId: string | null;
  readonly clientId: string | null;
  readonly paymentMethod: string;
  readonly discountTotal: number;
  readonly notes: string | null;
  readonly lines: readonly PosSaleLineInput[];
}

@Injectable({ providedIn: 'root' })
export class PosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/pos`;

  confirm(body: PosSaleRequest): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.baseUrl}/sales`, body);
  }
}

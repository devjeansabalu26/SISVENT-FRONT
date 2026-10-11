import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { PaymentMethodOption, PosPaymentLine } from '../models/payment.model';
import { SaleDetail } from '../models/sale-detail.model';

export interface PosSettings {
  readonly autoEmailReceipt: boolean;
  readonly emailConfigured: boolean;
}

export interface PosSaleLineInput {
  readonly productId: string;
  readonly quantity: number;
  readonly discountAmount: number;
}

export interface PosSaleRequest {
  readonly storeId: string | null;
  readonly sellerCode: string;
  readonly clientId: string | null;
  readonly paymentMethod: string;
  readonly discountTotal: number;
  readonly notes: string | null;
  readonly lines: readonly PosSaleLineInput[];
  readonly payments: readonly PosPaymentLine[];
}

@Injectable({ providedIn: 'root' })
export class PosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/pos`;

  paymentMethods(): Observable<readonly PaymentMethodOption[]> {
    return this.http.get<readonly PaymentMethodOption[]>(`${this.baseUrl}/payment-methods`);
  }

  settings(): Observable<PosSettings> {
    return this.http.get<PosSettings>(`${this.baseUrl}/settings`);
  }

  confirm(body: PosSaleRequest, idempotencyKey: string): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.baseUrl}/sales`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}

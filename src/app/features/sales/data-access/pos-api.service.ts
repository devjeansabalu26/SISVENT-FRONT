import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { PaymentMethodOption, PosPaymentLine } from '../models/payment.model';
import { SaleDetail } from '../models/sale-detail.model';

export interface PosSaleLineInput {
  readonly productId: string;
  readonly quantity: number;
  readonly discountAmount: number;
}

export interface PosSaleRequest {
  readonly storeId: string | null;
  readonly clientId: string | null;
  /** Método principal (el primero); el detalle completo va en `payments`. */
  readonly paymentMethod: string;
  readonly discountTotal: number;
  readonly notes: string | null;
  readonly lines: readonly PosSaleLineInput[];
  /** 1 a 5 pagos; p. ej. tarjeta S/ 6000 + efectivo S/ 800. */
  readonly payments: readonly PosPaymentLine[];
}

@Injectable({ providedIn: 'root' })
export class PosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/pos`;

  /** Métodos de pago activos de la empresa, con su tipo (CASH / CARD / DIGITAL). */
  paymentMethods(): Observable<readonly PaymentMethodOption[]> {
    return this.http.get<readonly PaymentMethodOption[]>(`${this.baseUrl}/payment-methods`);
  }

  confirm(body: PosSaleRequest): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.baseUrl}/sales`, body);
  }
}

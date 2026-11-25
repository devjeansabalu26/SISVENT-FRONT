import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';

export interface WholesalePrice {
  readonly id: string;
  readonly productId: string;
  readonly quantity: number;
  readonly price: number;
  readonly createdAt: string;
}

export interface WholesalePriceInput {
  readonly productId: string;
  readonly quantity: number;
  readonly price: number;
}

export function wholesaleTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

@Injectable({ providedIn: 'root' })
export class WholesalePriceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/wholesale-prices`;

  list(productId?: string): Observable<readonly WholesalePrice[]> {
    const params = productId ? new HttpParams().set('productId', productId) : undefined;
    return this.http.get<readonly WholesalePrice[]>(this.baseUrl, { params });
  }

  add(input: WholesalePriceInput): Observable<WholesalePrice> {
    return this.http.post<WholesalePrice>(this.baseUrl, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

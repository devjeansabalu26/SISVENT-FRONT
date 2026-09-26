import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { handleForbiddenInline } from '../../../core/http/http-context.tokens';
import { AbcAnalysis, ReplenishmentSummary, StagnantAnalysis, StockoutRisk } from '../models/replenishment.model';

@Injectable({ providedIn: 'root' })
export class ReplenishmentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/replenishment`;

  // El 403 (plan sin SUPPLY_ANALYTICS / ABC_ANALYSIS) lo muestra la pantalla, sin redirigir a /403.
  summary(): Observable<ReplenishmentSummary> {
    return this.http.get<ReplenishmentSummary>(`${this.baseUrl}/summary`, { context: handleForbiddenInline() });
  }

  stockoutRisk(): Observable<StockoutRisk> {
    return this.http.get<StockoutRisk>(`${this.baseUrl}/stockout-risk`, { context: handleForbiddenInline() });
  }

  abc(): Observable<AbcAnalysis> {
    return this.http.get<AbcAnalysis>(`${this.baseUrl}/abc`, { context: handleForbiddenInline() });
  }

  stagnant(days?: number): Observable<StagnantAnalysis> {
    const params = days ? new HttpParams().set('days', days) : undefined;
    return this.http.get<StagnantAnalysis>(`${this.baseUrl}/stagnant`, { params, context: handleForbiddenInline() });
  }
}

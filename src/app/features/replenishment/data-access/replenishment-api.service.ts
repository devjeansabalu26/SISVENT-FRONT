import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { handleForbiddenInline } from '../../../core/http/http-context.tokens';
import { AbcAnalysis, ReplenishmentSummary, StagnantAnalysis, StockoutRisk } from '../models/replenishment.model';

@Injectable({ providedIn: 'root' })
export class ReplenishmentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/replenishment`;
  private readonly storeContext = inject(StoreContextService);

  private params(): HttpParams {
    const storeId = this.storeContext.selectedStoreId();
    return storeId ? new HttpParams().set('storeId', storeId) : new HttpParams();
  }

  summary(): Observable<ReplenishmentSummary> {
    return this.http.get<ReplenishmentSummary>(`${this.baseUrl}/summary`, { params: this.params(), context: handleForbiddenInline() });
  }

  stockoutRisk(): Observable<StockoutRisk> {
    return this.http.get<StockoutRisk>(`${this.baseUrl}/stockout-risk`, { params: this.params(), context: handleForbiddenInline() });
  }

  abc(): Observable<AbcAnalysis> {
    return this.http.get<AbcAnalysis>(`${this.baseUrl}/abc`, { params: this.params(), context: handleForbiddenInline() });
  }

  stagnant(days?: number): Observable<StagnantAnalysis> {
    const params = days ? this.params().set('days', days) : this.params();
    return this.http.get<StagnantAnalysis>(`${this.baseUrl}/stagnant`, { params, context: handleForbiddenInline() });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { MyPlan, PlanChangeRequestResult } from '../models/company-plan.model';

@Injectable({ providedIn: 'root' })
export class CompanyPlanApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/company/plan`;

  get(): Observable<MyPlan> {
    return this.http.get<MyPlan>(this.baseUrl);
  }

  requestChange(planId: string, message: string): Observable<PlanChangeRequestResult> {
    return this.http.post<PlanChangeRequestResult>(`${this.baseUrl}/change-requests`, { planId, message });
  }
}

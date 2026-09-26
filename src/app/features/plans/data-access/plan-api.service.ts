import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { FeatureMatrix, Plan, PlanDetail, PlanFormValue } from '../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlanApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/plans`;

  list(): Observable<readonly Plan[]> {
    return this.http.get<readonly Plan[]>(this.baseUrl);
  }

  featureMatrix(): Observable<FeatureMatrix> {
    return this.http.get<FeatureMatrix>(`${this.baseUrl}/feature-matrix`);
  }

  get(id: string): Observable<PlanDetail> {
    return this.http.get<PlanDetail>(`${this.baseUrl}/${id}`);
  }

  create(body: PlanFormValue): Observable<PlanDetail> {
    return this.http.post<PlanDetail>(this.baseUrl, body);
  }

  update(id: string, body: PlanFormValue): Observable<PlanDetail> {
    return this.http.put<PlanDetail>(`${this.baseUrl}/${id}`, body);
  }
}

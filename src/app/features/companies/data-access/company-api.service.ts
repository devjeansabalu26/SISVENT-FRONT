import { CompanyExtraFeatures, CompanyModules, ModuleToggle } from '../models/company-modules.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  ChangeCompanyPlanValue,
  Company,
  CompanyDetail,
  CompanyOverview,
  CompanyPlan,
  CompanyStores,
  CompanySummary,
  CreateCompanyValue,
  PlanChangePreview,
  UpdateCompanyValue,
} from '../models/company.model';

interface ListParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: string;
  readonly planId?: string;
}

interface CompanyPage {
  readonly items: readonly Company[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class CompanyApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/companies`;

  list(params: ListParams = {}): Observable<CompanyPage> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 100);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.planId) httpParams = httpParams.set('planId', params.planId);
    return this.http.get<CompanyPage>(this.baseUrl, { params: httpParams });
  }

  summary(): Observable<CompanySummary> {
    return this.http.get<CompanySummary>(`${this.baseUrl}/summary`);
  }

  get(id: string): Observable<CompanyDetail> {
    return this.http.get<CompanyDetail>(`${this.baseUrl}/${id}`);
  }

  uploadLogo(id: string, file: File): Observable<{ readonly logoUrl: string | null }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ readonly logoUrl: string | null }>(`${this.baseUrl}/${id}/logo`, form);
  }

  removeLogo(id: string): Observable<{ readonly logoUrl: string | null }> {
    return this.http.delete<{ readonly logoUrl: string | null }>(`${this.baseUrl}/${id}/logo`);
  }

  getPlan(id: string): Observable<CompanyPlan> {
    return this.http.get<CompanyPlan>(`${this.baseUrl}/${id}/plan`);
  }

  getPlanChangePreview(id: string, planId: string): Observable<PlanChangePreview> {
    return this.http.get<PlanChangePreview>(`${this.baseUrl}/${id}/plan-change-preview`, { params: { planId } });
  }

  getModules(id: string): Observable<CompanyModules> {
    return this.http.get<CompanyModules>(`${this.baseUrl}/${id}/modules`);
  }

  getExtraFeatures(id: string): Observable<CompanyExtraFeatures> {
    return this.http.get<CompanyExtraFeatures>(`${this.baseUrl}/${id}/extra-features`);
  }

  updateExtraFeatures(id: string, codes: readonly string[], note: string | null): Observable<CompanyExtraFeatures> {
    return this.http.put<CompanyExtraFeatures>(`${this.baseUrl}/${id}/extra-features`, { codes, note });
  }

  updateModules(id: string, modules: readonly ModuleToggle[]): Observable<CompanyModules> {
    return this.http.put<CompanyModules>(`${this.baseUrl}/${id}/modules`, { modules });
  }

  getStores(id: string): Observable<CompanyStores> {
    return this.http.get<CompanyStores>(`${this.baseUrl}/${id}/stores`);
  }

  getOverview(id: string): Observable<CompanyOverview> {
    return this.http.get<CompanyOverview>(`${this.baseUrl}/${id}/summary`);
  }

  create(body: CreateCompanyValue): Observable<CompanyDetail> {
    return this.http.post<CompanyDetail>(this.baseUrl, body);
  }

  update(id: string, body: UpdateCompanyValue): Observable<CompanyDetail> {
    return this.http.put<CompanyDetail>(`${this.baseUrl}/${id}`, body);
  }

  suspend(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/suspend`, { reason });
  }

  activate(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, { reason });
  }

  deactivate(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, { reason });
  }

  changePlan(id: string, body: ChangeCompanyPlanValue): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/change-plan`, body);
  }
}

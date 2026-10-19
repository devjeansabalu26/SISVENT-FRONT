import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import {
  CompanyRegional,
  CountryDetail,
  CountryFields,
  CountryForm,
  CountryListItem,
  Currency,
  UpdateCompanyRegional,
} from '../models/country.model';

@Injectable({ providedIn: 'root' })
export class CountryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_CONFIG).apiBaseUrl;
  private readonly platformUrl = `${this.apiBaseUrl}/api/v1/platform`;

  list(): Observable<readonly CountryListItem[]> {
    return this.http.get<readonly CountryListItem[]>(`${this.platformUrl}/countries`);
  }

  get(code: string): Observable<CountryDetail> {
    return this.http.get<CountryDetail>(`${this.platformUrl}/countries/${code}`);
  }

  form(code: string): Observable<CountryForm> {
    return this.http.get<CountryForm>(`${this.platformUrl}/countries/${code}/form`);
  }

  create(body: CountryFields): Observable<CountryDetail> {
    return this.http.post<CountryDetail>(`${this.platformUrl}/countries`, body);
  }

  update(code: string, body: CountryFields): Observable<CountryDetail> {
    return this.http.put<CountryDetail>(`${this.platformUrl}/countries/${code}`, body);
  }

  setActive(code: string, active: boolean): Observable<CountryDetail> {
    return this.http.post<CountryDetail>(`${this.platformUrl}/countries/${code}/${active ? 'activate' : 'deactivate'}`, {});
  }

  currencies(): Observable<readonly Currency[]> {
    return this.http.get<readonly Currency[]>(`${this.platformUrl}/currencies`);
  }

  createCurrency(body: Currency): Observable<Currency> {
    return this.http.post<Currency>(`${this.platformUrl}/currencies`, body);
  }

  updateCurrency(code: string, body: Currency): Observable<Currency> {
    return this.http.put<Currency>(`${this.platformUrl}/currencies/${code}`, body);
  }

  companyRegional(companyId: string): Observable<CompanyRegional> {
    return this.http.get<CompanyRegional>(`${this.apiBaseUrl}/api/v1/companies/${companyId}/regional`);
  }

  updateCompanyRegional(companyId: string, body: UpdateCompanyRegional): Observable<CompanyRegional> {
    return this.http.put<CompanyRegional>(`${this.apiBaseUrl}/api/v1/companies/${companyId}/regional`, body);
  }
}

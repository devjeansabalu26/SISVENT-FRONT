import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { HANDLE_FORBIDDEN_INLINE } from '../http/http-context.tokens';
import { setRegional } from './regional-format';
import { CompanyRegional, DocumentTypeOption, PERU_DOCUMENT_TYPES, PERU_REGIONAL } from './regional.model';

@Injectable({ providedIn: 'root' })
export class RegionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/regional`;
  private readonly state = signal<CompanyRegional>(PERU_REGIONAL);
  private readonly documentTypesState = signal<readonly DocumentTypeOption[]>(PERU_DOCUMENT_TYPES);
  private documentTypesLoaded = false;
  private readonly context = () => new HttpContext().set(HANDLE_FORBIDDEN_INLINE, true);

  readonly regional = this.state.asReadonly();
  readonly documentTypes = this.documentTypesState.asReadonly();

  async load(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.http.get<CompanyRegional>(this.baseUrl, { context: this.context() })));
    } catch {
      this.apply(PERU_REGIONAL);
    }
  }

  apply(regional: CompanyRegional): void {
    setRegional(regional);
    this.state.set(regional);
  }

  async loadDocumentTypes(): Promise<readonly DocumentTypeOption[]> {
    if (this.documentTypesLoaded) return this.documentTypesState();
    try {
      const types = await firstValueFrom(this.http.get<readonly DocumentTypeOption[]>(`${this.baseUrl}/document-types`, { context: this.context() }));
      if (types.length > 0) this.documentTypesState.set(types);
      this.documentTypesLoaded = true;
    } catch {
      this.documentTypesState.set(PERU_DOCUMENT_TYPES);
    }
    return this.documentTypesState();
  }

  clear(): void {
    this.apply(PERU_REGIONAL);
    this.documentTypesState.set(PERU_DOCUMENT_TYPES);
    this.documentTypesLoaded = false;
  }
}

import { Injectable, signal } from '@angular/core';
import { CompanyContext } from './company-context.model';

@Injectable({ providedIn: 'root' })
export class CompanyContextService {
  private readonly companyState = signal<CompanyContext | null>(null);
  readonly company = this.companyState.asReadonly();

  set(company: CompanyContext): void {
    this.companyState.set(company);
  }

  setLogo(logoUrl: string | null): void {
    this.companyState.update((company) => (company ? { ...company, logoUrl: logoUrl ?? undefined } : company));
  }

  clear(): void {
    this.companyState.set(null);
  }
}

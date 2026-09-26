import { CompanyTheme } from '../../theme/company-theme.model';
import { CompanyPlan } from './company-plan.model';

export interface CompanyExpirationInfo {
  readonly expiresAt?: string;
  readonly isExpired: boolean;
}

export interface CompanyContext {
  readonly companyId: string;
  readonly commercialName: string;
  readonly plan: CompanyPlan;
  /** Códigos de features habilitadas por el plan vigente (plan_features/features). Real, del backend. */
  readonly features: readonly string[];
  readonly logoUrl?: string;
  readonly theme?: CompanyTheme;
  readonly expirationInfo?: CompanyExpirationInfo;
}

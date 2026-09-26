import { PlanFeatureRow, PlanLimitRow } from '../../plans/models/plan.model';

/** Mirrors CompanyListItem from GET /api/v1/companies. */
export interface Company {
  readonly id: string;
  readonly tradeName: string;
  readonly legalName: string | null;
  readonly taxDocument: string;
  readonly status: string;
  readonly administratorName: string | null;
  readonly administratorEmail: string | null;
  readonly planStart: string | null;
  readonly planEnd: string | null;
  readonly planName: string | null;
  readonly effectiveStatus: string;
  readonly storeCount: number;
  readonly userCount: number;
}

export interface CompanySummary {
  readonly totalCompanies: number;
  readonly active: number;
  readonly expiring: number;
  readonly expired: number;
  readonly suspended: number;
  readonly newThisMonth: number;
  readonly activeUsers: number;
}

export interface CompanyAccessEntry {
  readonly at: string;
  readonly ip: string | null;
  readonly result: string;
}

/** Mirrors CompanyDetailResponse from GET /api/v1/companies/{id}. */
export interface CompanyDetail {
  readonly id: string;
  readonly tradeName: string;
  readonly legalName: string | null;
  readonly taxDocument: string;
  readonly businessType: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly status: string;
  readonly internalNotes: string | null;
  readonly planName: string | null;
  readonly planCode: string | null;
  readonly contractedPrice: number | null;
  readonly planStart: string | null;
  readonly planEnd: string | null;
  readonly effectiveStatus: string;
  readonly daysRemaining: number;
  readonly administratorName: string | null;
  readonly administratorFirstName: string | null;
  readonly administratorLastName: string | null;
  readonly administratorEmail: string | null;
  readonly administratorPhone: string | null;
  readonly administratorDocument: string | null;
  readonly planId: string | null;
  readonly storeCount: number;
  readonly userCount: number;
  readonly vendorCount: number;
  readonly productCount: number;
  readonly clientCount: number;
  readonly firstStoreName: string | null;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly accentColor: string | null;
  readonly backgroundColor: string | null;
  readonly recentAccess: readonly CompanyAccessEntry[];
  /** Features habilitadas del plan activo (empresa → plan_features → features). Vacío si no tiene plan activo. */
  readonly planFeatures: readonly PlanFeatureRow[];
}

/** Mirrors CompanyPlanHistoryEntry: un cambio de plan de ESTA empresa (company_plan_periods + audit_logs). */
export interface CompanyPlanHistoryEntry {
  readonly changedAt: string;
  readonly previousPlanName: string | null;
  readonly newPlanName: string;
  readonly previousPrice: number | null;
  readonly newPrice: number;
  readonly actorName: string | null;
  readonly reason: string | null;
}

/** Mirrors CompanyPlanResponse from GET /api/v1/companies/{id}/plan (tab Cuenta / Plan). */
export interface CompanyPlan {
  readonly planId: string | null;
  readonly planCode: string | null;
  readonly planName: string | null;
  readonly planDescription: string | null;
  readonly currentPrice: number | null;
  readonly contractedPrice: number | null;
  readonly currencyCode: string;
  readonly effectiveStatus: string;
  readonly planStart: string | null;
  readonly planEnd: string | null;
  readonly daysRemaining: number;
  readonly limits: readonly PlanLimitRow[];
  readonly features: readonly PlanFeatureRow[];
  readonly history: readonly CompanyPlanHistoryEntry[];
}

/** Mirrors CompanyStoreItem: un local de la empresa con sus contadores reales (tab Locales). */
export interface CompanyStoreItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly isActive: boolean;
  readonly userCount: number;
  readonly vendorCount: number;
  readonly lastActivityAt: string | null;
}

/** Mirrors CompanyStoresResponse from GET /api/v1/companies/{id}/stores. */
export interface CompanyStores {
  readonly items: readonly CompanyStoreItem[];
  readonly totalStores: number;
  readonly activeStores: number;
  readonly inactiveStores: number;
  readonly recentlyActiveUsers: number;
}

/** Mirrors CompanyPlanUsage: uso real de un límite del plan (Max null = ilimitado). */
export interface CompanyPlanUsage {
  readonly code: string;
  readonly label: string;
  readonly used: number;
  readonly max: number | null;
}

/** Reutiliza la forma de PlatformAuditEntry (misma auditoría de plataforma, filtrada por esta empresa). */
export interface CompanyRecentActivity {
  readonly id: string;
  readonly createdAt: string;
  readonly actorName: string | null;
  readonly actorRole: string | null;
  readonly action: string;
  readonly entityName: string;
  readonly entityId: string | null;
  readonly level: 'INFO' | 'WARNING' | 'ERROR';
  readonly detail: string | null;
}

/** Mirrors CompanySummaryTabResponse from GET /api/v1/companies/{id}/summary (tab Resumen). */
export interface CompanyOverview {
  readonly storeCount: number;
  readonly userCount: number;
  readonly vendorCount: number;
  readonly productCount: number;
  readonly clientCount: number;
  readonly salesCount: number;
  readonly salesAmount: number;
  readonly totalStockUnits: number;
  readonly lowStockCount: number;
  readonly effectiveStatus: string;
  readonly planName: string | null;
  readonly planEnd: string | null;
  readonly daysRemaining: number;
  readonly planUsage: readonly CompanyPlanUsage[];
  readonly recentActivity: readonly CompanyRecentActivity[];
}

export interface CreateCompanyValue {
  readonly tradeName: string;
  readonly legalName: string;
  readonly taxDocument: string;
  readonly businessType: string | null;
  readonly phone: string | null;
  readonly email: string;
  readonly address: string;
  readonly internalNotes: string | null;
  readonly planId: string;
  readonly contractedPrice: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly initialStatus: string;
  readonly adminFirstName: string;
  readonly adminLastName: string;
  readonly adminEmail: string;
  readonly adminPhone: string | null;
  readonly adminDocument: string | null;
  readonly adminPassword: string;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly accentColor: string | null;
  readonly backgroundColor: string | null;
  readonly firstStoreName: string;
}

export interface UpdateCompanyValue {
  readonly tradeName: string;
  readonly legalName: string;
  readonly businessType: string | null;
  readonly phone: string | null;
  readonly email: string;
  readonly address: string;
  readonly internalNotes: string | null;
  readonly adminFirstName: string;
  readonly adminLastName: string;
  readonly adminPhone: string | null;
  readonly adminDocument: string | null;
  readonly planId: string;
  readonly contractedPrice: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly accentColor: string | null;
  readonly backgroundColor: string | null;
  readonly firstStoreName: string;
}

export interface ChangeCompanyPlanValue {
  readonly planId: string;
  readonly contractedPrice: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
}

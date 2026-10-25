export interface CompanyModule {
  readonly code: string;
  readonly label: string;
  readonly group: string;
  readonly planFeature: string | null;
  readonly includedInPlan: boolean;
  readonly enabled: boolean;
  readonly sellerAssignable: boolean;
}

export interface CompanyModules {
  readonly companyId: string;
  readonly planName: string | null;
  readonly modules: readonly CompanyModule[];
}

export interface ModuleToggle {
  readonly code: string;
  readonly enabled: boolean;
}

export interface CompanyFeature {
  readonly code: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string | null;
  readonly inPlan: boolean;
  readonly extra: boolean;
  readonly note: string | null;
  readonly grantedAt: string | null;
}

export interface CompanyExtraFeatures {
  readonly companyId: string;
  readonly planName: string | null;
  readonly features: readonly CompanyFeature[];
}

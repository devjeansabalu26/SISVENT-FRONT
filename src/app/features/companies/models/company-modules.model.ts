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

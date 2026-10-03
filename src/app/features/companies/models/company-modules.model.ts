/** `GET/PUT /api/v1/companies/{id}/modules` (SUPERADMIN): menús de la empresa. */
export interface CompanyModule {
  readonly code: string;
  readonly label: string;
  readonly group: string;
  /** Funcionalidad del plan que lo habilita; null = no depende del plan. */
  readonly planFeature: string | null;
  readonly includedInPlan: boolean;
  readonly enabled: boolean;
  /** false = menú de configuración (nunca se asigna a vendedores). */
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

export type EInvoicingCredentialMode = 'DESACTIVADA' | 'GENERAL' | 'PROPIA';
export type EInvoicingEnvironment = 'PRUEBAS' | 'PRODUCCION';

export interface EInvoicingProviderOption {
  readonly code: string;
  readonly name: string;
  readonly testOnly: boolean;
  readonly requiresCredentials: boolean;
  readonly requiresCompanyId: boolean;
}

export interface EInvoiceStatusCount {
  readonly kind: 'FACTURA' | 'NOTA_CREDITO';
  readonly status: string;
  readonly count: number;
}

export interface EInvoicingChecklist {
  readonly providerRegistered: boolean;
  readonly solAffiliation: boolean;
  readonly certificate: boolean;
  readonly sandboxTested: boolean;
}

export interface SharedCredentialInfo {
  readonly allowed: boolean;
  readonly configured: boolean;
  readonly providerCode: string | null;
  readonly providerName: string | null;
}

export interface CompanyEInvoicing {
  readonly companyId: string;
  readonly featureEnabled: boolean;
  readonly credentialMode: EInvoicingCredentialMode;
  readonly providerCode: string;
  readonly environment: EInvoicingEnvironment;
  readonly apiUrl: string | null;
  readonly apiTokenHint: string | null;
  readonly hasApiToken: boolean;
  readonly providerCompanyId: string | null;
  readonly fiscalAddress: string | null;
  readonly ubigeo: string | null;
  readonly establishmentCode: string;
  readonly invoiceSeries: string;
  readonly creditNoteSeries: string;
  readonly lastInvoiceNumber: number;
  readonly minNextInvoiceNumber: number;
  readonly providers: readonly EInvoicingProviderOption[];
  readonly shared: SharedCredentialInfo;
  readonly checklist: EInvoicingChecklist;
  readonly checklistUpdatedAt: string | null;
  readonly tokenEncryptionConfigured: boolean;
  readonly dispatcherEnabled: boolean;
  readonly counts: readonly EInvoiceStatusCount[];
  readonly missingForSending: readonly string[];
  readonly updatedAt: string | null;
}

export interface UpdateCompanyEInvoicing {
  readonly credentialMode: EInvoicingCredentialMode;
  readonly providerCode: string | null;
  readonly environment: EInvoicingEnvironment;
  readonly apiUrl: string | null;
  readonly apiToken: string | null;
  readonly clearApiToken: boolean;
  readonly providerCompanyId: string | null;
  readonly fiscalAddress: string | null;
  readonly ubigeo: string | null;
  readonly establishmentCode: string;
  readonly creditNoteSeries: string;
  readonly nextInvoiceNumber: number | null;
  readonly checklistProviderRegistered: boolean;
  readonly checklistSolAffiliation: boolean;
  readonly checklistCertificate: boolean;
  readonly checklistSandboxTested: boolean;
}

export interface BlockedRucLookupUser {
  readonly identityUserId: string;
  readonly name: string;
  readonly userCode: string | null;
  readonly blockedRuc: string | null;
  readonly blockedAt: string;
}

export interface ConnectionTestResult {
  readonly ok: boolean;
  readonly message: string;
}

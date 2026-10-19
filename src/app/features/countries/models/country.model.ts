export interface Currency {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly isActive: boolean;
}

export interface CountryListItem {
  readonly code: string;
  readonly name: string;
  readonly currencyCode: string;
  readonly taxName: string;
  readonly taxRate: number;
  readonly taxIdName: string;
  readonly eInvoicingAuthority: string | null;
  readonly isActive: boolean;
  readonly activationBlocker: string | null;
  readonly companyCount: number;
}

export interface CountryDocumentType {
  readonly code: string;
  readonly name: string;
  readonly placeholder: string | null;
  readonly pattern: string;
  readonly checkDigit: string | null;
  readonly isBusiness: boolean;
  readonly isDefault: boolean;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface CountryTaxRegime {
  readonly code: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface CountryTimezone {
  readonly timezone: string;
  readonly name: string;
  readonly sortOrder: number;
}

export interface CountryReceiptType {
  readonly code: string;
  readonly name: string;
  readonly seriesLabel: string;
  readonly seriesPattern: string;
  readonly seriesPlaceholder: string | null;
  readonly defaultSeries: string | null;
  readonly forBusinessClient: boolean;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface CountryFields {
  readonly code: string;
  readonly name: string;
  readonly defaultCurrencyCode: string;
  readonly defaultLocale: string;
  readonly defaultTimezone: string;
  readonly defaultDateFormat: string;
  readonly defaultTaxRegimeCode: string | null;
  readonly taxName: string;
  readonly defaultTaxRate: number;
  readonly pricesIncludeTaxDefault: boolean;
  readonly taxIdName: string;
  readonly taxIdLabel: string;
  readonly taxIdPlaceholder: string | null;
  readonly taxIdPattern: string;
  readonly taxIdCheckDigit: string | null;
  readonly phonePrefix: string | null;
  readonly eInvoicingAuthority: string | null;
  readonly activationBlocker: string | null;
  readonly documentTypes: readonly CountryDocumentType[];
  readonly taxRegimes: readonly CountryTaxRegime[];
  readonly timezones: readonly CountryTimezone[];
  readonly receiptTypes: readonly CountryReceiptType[];
}

export interface CountryDetail extends CountryFields {
  readonly isActive: boolean;
  readonly companyCount: number;
}

export interface CountryForm {
  readonly country: CountryDetail;
  readonly currency: Currency;
  readonly currencies: readonly Currency[];
}

export interface CompanyRegional {
  readonly companyId: string;
  readonly countryCode: string;
  readonly countryName: string;
  readonly currencyCode: string;
  readonly locale: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly taxRate: number;
  readonly taxRegime: string;
  readonly taxDocument: string;
  readonly version: number;
  readonly hasSales: boolean;
  readonly hasCashActivity: boolean;
  readonly regionalUpdatedAt: string | null;
  readonly lockedFields: readonly string[];
}

export interface UpdateCompanyRegional {
  readonly countryCode: string;
  readonly currencyCode: string;
  readonly locale: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly taxRate: number;
  readonly taxRegime: string;
  readonly taxDocument?: string | null;
  readonly version: number;
  readonly reason: string;
  readonly confirmTimezoneChange: boolean;
}

export const DATE_FORMATS: readonly string[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY', 'DD-MM-YYYY', 'YYYY/MM/DD'];

export const CHECK_DIGITS: readonly { readonly value: string; readonly label: string }[] = [
  { value: '', label: 'Sin dígito verificador' },
  { value: 'PE_RUC', label: 'RUC de Perú' },
  { value: 'CO_NIT', label: 'NIT de Colombia' },
  { value: 'AR_CUIT', label: 'CUIT de Argentina' },
  { value: 'CL_RUT', label: 'RUT de Chile' },
  { value: 'BR_CPF', label: 'CPF de Brasil' },
  { value: 'BR_CNPJ', label: 'CNPJ de Brasil' },
];

export function problemTitle(cause: unknown, fallback: string): string {
  const original = (cause as { originalError?: { error?: { title?: unknown; code?: unknown } } } | null)?.originalError;
  const title = original?.error?.title;
  return typeof title === 'string' && title.trim() ? title : fallback;
}

export function problemCode(cause: unknown): string | null {
  const code = (cause as { originalError?: { error?: { code?: unknown } } } | null)?.originalError?.error?.code;
  return typeof code === 'string' ? code : null;
}

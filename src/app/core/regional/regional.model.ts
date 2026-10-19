export interface RegionalReceiptSeries {
  readonly receiptTypeCode: string;
  readonly name: string;
  readonly seriesLabel: string;
  readonly seriesPattern: string;
  readonly seriesPlaceholder: string | null;
  readonly forBusinessClient: boolean;
  readonly series: string | null;
}

export interface CompanyRegional {
  readonly countryCode: string;
  readonly countryName: string;
  readonly currencyCode: string;
  readonly currencySymbol: string;
  readonly currencyDecimals: number;
  readonly locale: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly taxName: string;
  readonly taxRate: number;
  readonly taxRegime: string;
  readonly taxIdName: string;
  readonly eInvoicingAuthority: string | null;
  readonly pricesIncludeTax: boolean;
  readonly series: readonly RegionalReceiptSeries[];
  readonly taxRegimeName?: string | null;
}

export interface DocumentTypeOption {
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

export const PERU_REGIONAL: CompanyRegional = {
  countryCode: 'PE',
  countryName: 'Perú',
  currencyCode: 'PEN',
  currencySymbol: 'S/',
  currencyDecimals: 2,
  locale: 'es-PE',
  timezone: 'America/Lima',
  dateFormat: 'DD/MM/YYYY',
  taxName: 'IGV',
  taxRate: 0.18,
  taxRegime: 'RMT',
  taxIdName: 'RUC',
  eInvoicingAuthority: 'SUNAT',
  pricesIncludeTax: true,
  series: [],
};

export const PERU_DOCUMENT_TYPES: readonly DocumentTypeOption[] = [
  { code: 'DNI', name: 'Documento Nacional de Identidad', placeholder: '12345678', pattern: '^\\d{8}$', checkDigit: null, isBusiness: false, isDefault: true, sortOrder: 1, isActive: true },
  { code: 'RUC', name: 'Registro Único de Contribuyentes', placeholder: '20123456786', pattern: '^\\d{11}$', checkDigit: 'PE_RUC', isBusiness: true, isDefault: false, sortOrder: 2, isActive: true },
  { code: 'CE', name: 'Carné de extranjería', placeholder: null, pattern: '^[A-Z0-9]{6,12}$', checkDigit: null, isBusiness: false, isDefault: false, sortOrder: 3, isActive: true },
];

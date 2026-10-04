export interface CompanyTheme {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly surfaceColor: string;
  readonly logoUrl: string | null;
}

export interface CompanyFiscal {
  readonly taxRegime: string;
  readonly currencyCode: string;
  readonly receiptSeries: string;
  readonly invoiceSeries: string;
}

export interface CompanyProfile {
  readonly id: string;
  readonly tradeName: string;
  readonly legalName: string | null;
  readonly taxDocument: string;
  readonly businessType: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly planName: string | null;
  readonly theme: CompanyTheme;
  readonly fiscal: CompanyFiscal | null;
}

export interface UpdateCompanyProfile {
  readonly businessType: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
}

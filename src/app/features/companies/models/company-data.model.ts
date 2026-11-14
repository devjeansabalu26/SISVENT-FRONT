export interface ProductImportRow {
  readonly rowNumber: number;
  readonly name: string | null;
  readonly sku: string | null;
  readonly barcode: string | null;
  readonly category: string | null;
  readonly brand: string | null;
  readonly unit: string | null;
  readonly salePrice: string | null;
  readonly cost: string | null;
  readonly initialStock: string | null;
  readonly minStock: string | null;
}

export interface ProductImportRequest {
  readonly storeId: string;
  readonly dryRun: boolean;
  readonly rows: readonly ProductImportRow[];
}

export type ProductImportStatus = 'NEW' | 'SKIPPED' | 'ERROR';

export interface ProductImportRowResult {
  readonly rowNumber: number;
  readonly name: string | null;
  readonly sku: string | null;
  readonly status: ProductImportStatus;
  readonly message: string | null;
}

export interface ProductImportResult {
  readonly dryRun: boolean;
  readonly total: number;
  readonly newCount: number;
  readonly skippedCount: number;
  readonly errorCount: number;
  readonly newCategories: number;
  readonly newBrands: number;
  readonly newUnits: number;
  readonly currentProducts: number;
  readonly maxProducts: number | null;
  readonly planName: string | null;
  readonly exceedsPlanLimit: boolean;
  readonly rows: readonly ProductImportRowResult[];
}

export type CompanyExportValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export interface CompanyExportSheet {
  readonly name: string;
  readonly rowCount: number;
  readonly rows: readonly Record<string, CompanyExportValue>[];
}

export interface CompanyWipeCode {
  readonly sentTo: string;
  readonly expiresAt: string;
}

export interface CompanyWipeTableCount {
  readonly table: string;
  readonly rows: number;
}

export interface CompanyWipeResult {
  readonly keptAdminName: string;
  readonly keptStoreName: string;
  readonly totalRows: number;
  readonly tables: readonly CompanyWipeTableCount[];
}

export interface CompanyDeleteResult {
  readonly companyName: string;
  readonly totalRows: number;
  readonly tables: readonly CompanyWipeTableCount[];
}

export interface CompanyExport {
  readonly companyId: string;
  readonly companyName: string;
  readonly generatedAt: string;
  readonly sheets: readonly CompanyExportSheet[];
}

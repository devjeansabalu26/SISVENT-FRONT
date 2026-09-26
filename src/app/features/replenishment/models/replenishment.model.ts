/** Mirrors /api/v1/replenishment/* (Sisvent.Application.Replenishment). */
export type RiskCode = 'CRITICAL' | 'MODERATE' | 'OPTIMAL' | 'NO_SALES';
export type PurchasePriority = 'CRITICA' | 'ALTA' | 'MEDIA';
export type AbcClassCode = 'A' | 'B' | 'C';

export interface StockRiskItem {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly currentStock: number;
  readonly minStock: number;
  readonly averageDailySales: number;
  /** null = sin ventas en la ventana. */
  readonly coverageDays: number | null;
  readonly risk: RiskCode;
  readonly supplierName: string | null;
  readonly leadTimeDays: number;
  readonly safetyStock: number;
  readonly suggestedQuantity: number;
  readonly priority: PurchasePriority | null;
}

export interface CoverageBreakdown {
  readonly sufficient: number;
  readonly moderate: number;
  readonly critical: number;
  readonly noSales: number;
}

export interface ReplenishmentSummary {
  readonly monitored: number;
  readonly atRisk: number;
  readonly averageCoverageDays: number | null;
  readonly highRotation: number;
  readonly recommendations: number;
  readonly coverage: CoverageBreakdown;
  readonly suggestions: readonly StockRiskItem[];
  readonly critical: readonly StockRiskItem[];
  readonly windowDays: number;
}

export interface StockoutRisk {
  readonly items: readonly StockRiskItem[];
  readonly coverage: CoverageBreakdown;
  readonly windowDays: number;
}

export interface AbcClassSummary {
  readonly class: AbcClassCode;
  readonly items: number;
  readonly revenue: number;
  /** % de los ingresos de la ventana. */
  readonly valueShare: number;
}

export interface AbcItem {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly class: AbcClassCode;
  readonly quantity: number;
  readonly revenue: number;
  readonly share: number;
  readonly cumulativeShare: number;
  readonly rotation: 'Alta' | 'Media' | 'Baja';
  readonly marginPercent: number | null;
}

export interface AbcAnalysis {
  readonly classes: readonly AbcClassSummary[];
  readonly items: readonly AbcItem[];
  readonly totalRevenue: number;
  readonly windowDays: number;
}

export interface StagnantItem {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly stock: number;
  /** null = nunca se vendió. */
  readonly daysWithoutSale: number | null;
  readonly value: number;
  readonly lastSaleAt: string | null;
  readonly lastMovementAt: string | null;
  readonly cause: string;
  readonly suggestedAction: string;
}

export interface StagnantAnalysis {
  readonly immobilizedCapital: number;
  readonly inactiveProducts: number;
  readonly averageDaysWithoutSale: number | null;
  readonly estimatedExcess: number;
  readonly items: readonly StagnantItem[];
  readonly thresholdDays: number;
}

/** Texto de riesgo en español (el chip de estado colorea Crítico / Moderado). */
export const RISK_LABELS: Readonly<Record<RiskCode, string>> = {
  CRITICAL: 'Crítico',
  MODERATE: 'Moderado',
  OPTIMAL: 'Óptimo',
  NO_SALES: 'Sin ventas',
};

export const PRIORITY_LABELS: Readonly<Record<PurchasePriority, string>> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
};

export type RiskLevel = 'Crítico' | 'Moderado' | 'Óptimo';
export type AbcClass = 'Clase A' | 'Clase B' | 'Clase C';

export interface CriticalProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly stock: number;
  readonly avgSales: string;
  readonly coverageDays: number;
  readonly risk: RiskLevel;
}

export interface PurchaseSuggestion {
  readonly id: string;
  readonly product: string;
  readonly supplier: string;
  readonly quantity: string;
  readonly priority: 'Crítica' | 'Alta' | 'Media';
}

export interface AbcProduct {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly abcClass: AbcClass;
  readonly monthlySales: string;
  readonly rotation: 'Alta' | 'Media' | 'Baja';
  readonly margin: string;
  readonly revenue: string;
}

export interface StagnantProduct {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly stock: number;
  readonly daysWithoutSale: number;
  readonly value: string;
  readonly lastMovement: string;
  readonly cause: string;
  readonly suggestedAction: string;
}

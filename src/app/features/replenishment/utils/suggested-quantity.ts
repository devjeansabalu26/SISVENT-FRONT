export interface ReplenishmentInput {
  readonly currentStock: number;
  readonly averageDailySales: number;
  readonly leadTimeDays: number;
  readonly safetyStock: number;
}

export interface SuggestedQuantity {
  readonly raw: number;
  readonly rounded: number;
  readonly coverageDays: number | null;
}

export function computeSuggestedQuantity(input: ReplenishmentInput): SuggestedQuantity {
  const raw = input.averageDailySales * input.leadTimeDays + input.safetyStock - input.currentStock;
  const coverageDays =
    input.averageDailySales > 0 ? Math.round((input.currentStock / input.averageDailySales) * 10) / 10 : null;
  return { raw, rounded: Math.max(0, Math.ceil(raw)), coverageDays };
}

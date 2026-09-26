/** Entradas del cálculo de reabastecimiento "SISVENT Smart Stock" (Figma MOD-PR-03). */
export interface ReplenishmentInput {
  readonly currentStock: number;
  /** Unidades vendidas por día (promedio). */
  readonly averageDailySales: number;
  /** Días hábiles entre el pedido y la recepción. */
  readonly leadTimeDays: number;
  readonly safetyStock: number;
}

export interface SuggestedQuantity {
  /** Resultado exacto de la fórmula (puede tener decimales o ser negativo). */
  readonly raw: number;
  /** Cantidad a comprar: entero superior, nunca negativa. */
  readonly rounded: number;
  /** Días que cubre el stock actual al ritmo de venta; `null` si no hay ventas. */
  readonly coverageDays: number | null;
}

/**
 * Sugerido = (Venta Promedio × Tiempo de Reposición) + Stock de Seguridad − Stock Actual,
 * ajustado al entero superior y con piso en 0.
 */
export function computeSuggestedQuantity(input: ReplenishmentInput): SuggestedQuantity {
  const raw = input.averageDailySales * input.leadTimeDays + input.safetyStock - input.currentStock;
  const coverageDays =
    input.averageDailySales > 0 ? Math.round((input.currentStock / input.averageDailySales) * 10) / 10 : null;
  return { raw, rounded: Math.max(0, Math.ceil(raw)), coverageDays };
}

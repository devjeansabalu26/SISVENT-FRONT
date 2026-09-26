import { ReplenishmentInput } from '../utils/suggested-quantity';

/**
 * Placeholder: parámetros del cálculo detrás de cada compra sugerida (`PURCHASE_SUGGESTION_MOCK`, mismo `id`).
 * Están elegidos para que la fórmula dé exactamente la cantidad que muestra la lista. Sin endpoint todavía.
 */
export const RECOMMENDATION_INPUT_MOCK: Readonly<Record<string, ReplenishmentInput>> = {
  '1': { currentStock: 40, averageDailySales: 45, leadTimeDays: 10, safetyStock: 90 },
  '2': { currentStock: 25, averageDailySales: 15, leadTimeDays: 12, safetyStock: 45 },
  '3': { currentStock: 300, averageDailySales: 90, leadTimeDays: 14, safetyStock: 240 },
  '4': { currentStock: 160, averageDailySales: 60, leadTimeDays: 12, safetyStock: 240 },
};

/** Método de cálculo mostrado en el modal (texto de Figma). */
export const RECOMMENDATION_METHOD = 'Min / Max Pro';

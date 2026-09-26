/**
 * Estado del margen (Precio y Finanzas, formulario de Producto). No existía una regla previa en el
 * sistema (el formulario solo mostraba el % crudo); los umbrales quedan centralizados aquí para no
 * repetirlos ni improvisarlos por componente. Ajustar solo este archivo si el negocio define otro umbral.
 */
export type MarginStatus = 'HEALTHY' | 'LOW' | 'NEGATIVE';

const LOW_MARGIN_THRESHOLD = 15;

export function marginStatus(marginPercent: number): MarginStatus {
  if (marginPercent < 0) return 'NEGATIVE';
  if (marginPercent < LOW_MARGIN_THRESHOLD) return 'LOW';
  return 'HEALTHY';
}

export const MARGIN_STATUS_LABEL: Readonly<Record<MarginStatus, string>> = {
  HEALTHY: 'Saludable',
  LOW: 'Bajo',
  NEGATIVE: 'Negativo',
};

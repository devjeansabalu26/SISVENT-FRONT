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

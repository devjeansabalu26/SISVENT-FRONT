import { TopProduct } from '../models/sales-report.model';

export type MatrixQuadrant = 'star' | 'hook' | 'opportunity' | 'review';

export interface MatrixGroup {
  readonly quadrant: MatrixQuadrant;
  readonly title: string;
  readonly hint: string;
  readonly icon: string;
  readonly products: readonly TopProduct[];
}

export interface ProductMatrix {
  readonly groups: readonly MatrixGroup[];
  readonly withoutCost: readonly TopProduct[];
  readonly unitsThreshold: number;
  readonly marginThreshold: number;
}

const META: Readonly<Record<MatrixQuadrant, Omit<MatrixGroup, 'quadrant' | 'products'>>> = {
  star: { title: 'Estrellas', hint: 'Venden mucho y dejan buen margen. Que nunca falten.', icon: 'star' },
  hook: { title: 'Gancho', hint: 'Venden mucho con poco margen. Atraen clientes; revisa su precio.', icon: 'campaign' },
  opportunity: { title: 'Oportunidad', hint: 'Buen margen pero se venden poco. Exhíbelos y promociónalos.', icon: 'lightbulb' },
  review: { title: 'Revisar', hint: 'Poca venta y poco margen. Liquida o deja de comprarlos.', icon: 'report' },
};

export function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function productMatrix(products: readonly TopProduct[]): ProductMatrix {
  const withCost = products.filter((product) => product.marginPercent !== null);
  const unitsThreshold = median(withCost.map((product) => product.units));
  const marginThreshold = median(withCost.map((product) => product.marginPercent ?? 0));
  const buckets: Record<MatrixQuadrant, TopProduct[]> = { star: [], hook: [], opportunity: [], review: [] };
  for (const product of withCost) {
    const sellsMuch = product.units >= unitsThreshold;
    const goodMargin = (product.marginPercent ?? 0) >= marginThreshold;
    const quadrant: MatrixQuadrant = sellsMuch ? (goodMargin ? 'star' : 'hook') : goodMargin ? 'opportunity' : 'review';
    buckets[quadrant].push(product);
  }
  const order: readonly MatrixQuadrant[] = ['star', 'hook', 'opportunity', 'review'];
  return {
    groups: order.map((quadrant) => ({
      quadrant,
      ...META[quadrant],
      products: [...buckets[quadrant]].sort((a, b) => b.revenue - a.revenue),
    })),
    withoutCost: products.filter((product) => product.marginPercent === null),
    unitsThreshold,
    marginThreshold,
  };
}

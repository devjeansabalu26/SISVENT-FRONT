import { PlanFeatureRow } from '../../features/plans/models/plan.model';

export interface FeatureDomainGroup {
  readonly domain: string;
  readonly items: readonly PlanFeatureRow[];
}

export function groupFeaturesByDomain(features: readonly PlanFeatureRow[]): readonly FeatureDomainGroup[] {
  const groups = new Map<string, PlanFeatureRow[]>();
  for (const feature of features) {
    const list = groups.get(feature.domain) ?? [];
    list.push(feature);
    groups.set(feature.domain, list);
  }
  return Array.from(groups.entries()).map(([domain, items]) => ({ domain, items }));
}

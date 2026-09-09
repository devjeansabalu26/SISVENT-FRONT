import { PlanFeatureRow, PlanListItem } from '../models/plan.model';

/** Placeholder data — no backend endpoint for commercial plans yet. */
export const PLAN_MOCK: readonly PlanListItem[] = [
  { id: '1', code: 'ESS', name: 'Esencial', price: 40, status: 'ACTIVE', sellerLimit: '1', localLimit: '1', modules: 'Básico', companyCount: 12 },
  { id: '2', code: 'NEG', name: 'Negocio', price: 60, status: 'ACTIVE', sellerLimit: '3', localLimit: '2', modules: 'Reportes, Auditoría', companyCount: 8 },
  { id: '3', code: 'PRO', name: 'Profesional', price: 120, status: 'ACTIVE', sellerLimit: 'Configurable', localLimit: 'Configurable', modules: 'Proveedores, Abastecimiento, Mercadería', companyCount: 4 },
];

export const PLAN_FEATURE_MATRIX: readonly PlanFeatureRow[] = [
  { feature: 'Dashboard', essential: 'Básico', business: 'Analítico', professional: 'Analítico' },
  { feature: 'Reportes', essential: '—', business: 'Completa', professional: 'Completa' },
  { feature: 'Auditoría', essential: 'Básica', business: 'Completa', professional: 'Completa' },
  { feature: 'Proveedores', essential: '—', business: '—', professional: 'Incluido' },
  { feature: 'Ingreso de mercadería', essential: '—', business: '—', professional: 'Incluido' },
  { feature: 'Abastecimiento', essential: '—', business: '—', professional: 'Incluido' },
];

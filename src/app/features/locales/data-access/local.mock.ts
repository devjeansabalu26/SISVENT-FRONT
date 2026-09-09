import { LocalItem, PlanLimit } from '../models/local.model';

/** Placeholder data — no backend endpoint for locales yet. */
export const LOCAL_MOCK: readonly LocalItem[] = [
  {
    id: '1',
    code: 'LOC-001',
    name: 'Local Centro',
    address: 'Av. Arequipa 1234, Miraflores, Lima',
    phone: '01-4567890',
    sellerCount: 2,
    status: 'ACTIVE',
  },
];

export const LOCAL_PLAN_LIMIT: PlanLimit = { used: 1, total: 2, planName: 'Negocio' };

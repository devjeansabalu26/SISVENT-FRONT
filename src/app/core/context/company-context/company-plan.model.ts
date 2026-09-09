export const COMPANY_PLANS = ['BASIC', 'PRO', 'BUSINESS'] as const;
export type CompanyPlan = (typeof COMPANY_PLANS)[number];

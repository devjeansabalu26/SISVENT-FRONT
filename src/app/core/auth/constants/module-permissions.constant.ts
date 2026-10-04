import { APP_PERMISSIONS, AppPermission } from './app-permission.constant';

export type ModuleLevel = 'VIEW' | 'MANAGE';

export interface SessionModule {
  readonly code: string;
  readonly level: ModuleLevel;
}

export const MODULE_PERMISSIONS: Readonly<Record<string, { readonly view: readonly AppPermission[]; readonly manage: readonly AppPermission[] }>> = {
  DASHBOARD: { view: [APP_PERMISSIONS.dashboardView], manage: [] },
  POS: { view: [APP_PERMISSIONS.salesCreate], manage: [] },
  SALES: { view: [APP_PERMISSIONS.salesView], manage: [APP_PERMISSIONS.salesManage] },
  CLIENTS: { view: [APP_PERMISSIONS.customersView], manage: [APP_PERMISSIONS.customersManage] },
  PRODUCTS: { view: [APP_PERMISSIONS.productsView], manage: [APP_PERMISSIONS.productsManage] },
  CATEGORIES: { view: [APP_PERMISSIONS.categoriesView], manage: [APP_PERMISSIONS.categoriesManage] },
  BRANDS: { view: [APP_PERMISSIONS.brandsView], manage: [APP_PERMISSIONS.brandsManage] },
  INVENTORY: { view: [APP_PERMISSIONS.inventoryView], manage: [APP_PERMISSIONS.inventoryAdjust] },
  MOVEMENTS: { view: [APP_PERMISSIONS.inventoryMovementsView], manage: [] },
  STORES: { view: [APP_PERMISSIONS.localesView], manage: [APP_PERMISSIONS.localesManage] },
  SUPPLIERS: { view: [APP_PERMISSIONS.suppliersView], manage: [APP_PERMISSIONS.suppliersManage] },
  GOODS_RECEIPTS: { view: [APP_PERMISSIONS.goodsReceiptsView], manage: [APP_PERMISSIONS.goodsReceiptsManage] },
  REPLENISHMENT: { view: [APP_PERMISSIONS.replenishmentView], manage: [] },
  COMPANY_PROFILE: { view: [APP_PERMISSIONS.companyProfileView], manage: [] },
  COMPANY_PLAN: { view: [APP_PERMISSIONS.companyPlanView], manage: [] },
  USERS: { view: [APP_PERMISSIONS.usersView, APP_PERMISSIONS.usersCreate, APP_PERMISSIONS.usersEdit], manage: [] },
  REPORTS: { view: [APP_PERMISSIONS.reportsView], manage: [] },
  AUDIT: { view: [APP_PERMISSIONS.auditView], manage: [] },
  NOTIFICATIONS: { view: [APP_PERMISSIONS.notificationsView], manage: [] },
  SETTINGS: { view: [APP_PERMISSIONS.settingsManage], manage: [] },
};

export function permissionsFromModules(modules: readonly SessionModule[]): readonly AppPermission[] {
  const result = new Set<AppPermission>();
  for (const module of modules) {
    const entry = MODULE_PERMISSIONS[module.code];
    if (!entry) continue;
    entry.view.forEach((permission) => result.add(permission));
    if (module.level === 'MANAGE') entry.manage.forEach((permission) => result.add(permission));
  }
  return [...result];
}

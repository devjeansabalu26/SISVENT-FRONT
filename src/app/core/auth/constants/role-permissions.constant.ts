import { APP_PERMISSIONS, AppPermission } from './app-permission.constant';
import { AppRole } from './app-role.constant';

/**
 * Respaldo cuando la sesión no trae `company.modules` (backend anterior a los menús configurables). Con
 * menús, ADMIN y VENDEDOR toman sus permisos de MODULE_PERMISSIONS (module-permissions.constant.ts).
 *
 * UI-only projection of a backend role onto the permission slugs the frontend
 * uses to decide which navigation entries and client routes are visible.
 *
 * The backend `/auth/login` and `/auth/me` responses do not carry permissions
 * (see SISVENT-BACK/docs/AUTH.md §E); it stays the sole authority on every
 * request. This map never grants real access — a hidden menu item whose route
 * is reached directly is still rejected server-side.
 */
export const ROLE_PERMISSIONS: Readonly<Record<AppRole, readonly AppPermission[]>> = {
  SUPERADMIN: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.companiesView,
    APP_PERMISSIONS.companiesManage,
    APP_PERMISSIONS.usersView,
    APP_PERMISSIONS.usersCreate,
    APP_PERMISSIONS.usersEdit,
    APP_PERMISSIONS.auditView,
    APP_PERMISSIONS.plansManage,
    APP_PERMISSIONS.notificationsView,
  ],
  ADMIN: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.usersView,
    APP_PERMISSIONS.usersCreate,
    APP_PERMISSIONS.usersEdit,
    APP_PERMISSIONS.productsView,
    APP_PERMISSIONS.productsManage,
    APP_PERMISSIONS.categoriesView,
    APP_PERMISSIONS.categoriesManage,
    APP_PERMISSIONS.brandsView,
    APP_PERMISSIONS.brandsManage,
    APP_PERMISSIONS.inventoryView,
    APP_PERMISSIONS.inventoryAdjust,
    APP_PERMISSIONS.inventoryMovementsView,
    APP_PERMISSIONS.salesView,
    APP_PERMISSIONS.salesCreate,
    APP_PERMISSIONS.salesManage,
    APP_PERMISSIONS.customersView,
    APP_PERMISSIONS.customersManage,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.auditView,
    APP_PERMISSIONS.settingsManage,
    APP_PERMISSIONS.notificationsView,
    APP_PERMISSIONS.companyProfileView,
    APP_PERMISSIONS.companyPlanView,
    APP_PERMISSIONS.localesView,
    APP_PERMISSIONS.localesManage,
    APP_PERMISSIONS.suppliersView,
    APP_PERMISSIONS.suppliersManage,
    APP_PERMISSIONS.goodsReceiptsView,
    APP_PERMISSIONS.goodsReceiptsManage,
    APP_PERMISSIONS.replenishmentView,
  ],
  VENDEDOR: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.productsView,
    APP_PERMISSIONS.categoriesView,
    APP_PERMISSIONS.salesView,
    APP_PERMISSIONS.salesCreate,
    APP_PERMISSIONS.customersView,
    APP_PERMISSIONS.customersManage,
  ],
};

import { NavigationItem } from './navigation-item.model';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';

/**
 * Add entries alongside implemented feature routes; backend authorization remains definitive.
 * `group` renders an optional uppercase section heading in the sidebar (Figma nav groups).
 * Headings with no visible items for the current user are not rendered.
 * `requiredFeature`: funcionalidad del plan (tabla `features`). Si el plan no la incluye, el ítem se
 * muestra con candado y lleva a la pantalla "Disponible en un plan superior".
 */
export const MAIN_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', permissions: [APP_PERMISSIONS.dashboardView] },

  // Plataforma — SUPERADMIN
  { label: 'Empresas', icon: 'business', route: '/app/companies', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesView] },
  { label: 'Planes y precios', icon: 'sell', route: '/app/plans', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] },
  { label: 'Usuarios globales', icon: 'groups', route: '/app/users', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.usersView] },

  // Operaciones — ADMIN / VENDEDOR
  { label: 'Punto de venta', icon: 'shopping_cart', route: '/app/pos', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesCreate], requiredFeature: 'SALES' },
  { label: 'Ventas', icon: 'point_of_sale', route: '/app/sales', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesView], requiredFeature: 'SALES' },
  { label: 'Clientes', icon: 'badge', route: '/app/customers', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView], requiredFeature: 'CLIENTS' },

  // Catálogo — ADMIN / VENDEDOR. requiredFeature refleja plan_features reales (ver bd.sql §12): un plan
  // sin ese feature no ve la opción, y la ruta/el backend la rechazan igual si se entra por URL directa.
  { label: 'Productos', icon: 'inventory_2', route: '/app/products', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' },
  { label: 'Categorías', icon: 'category', route: '/app/categories', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.categoriesView], requiredFeature: 'CATEGORIES' },
  { label: 'Marcas', icon: 'branding_watermark', route: '/app/brands', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.brandsView], requiredFeature: 'BRANDS' },

  // Almacén — ADMIN
  { label: 'Inventario', icon: 'warehouse', route: '/app/inventory', group: 'Almacén', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.inventoryView], requiredFeature: 'STOCK' },
  { label: 'Movimientos', icon: 'swap_vert', route: '/app/inventory/movements', group: 'Almacén', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.inventoryMovementsView], requiredFeature: 'INVENTORY_MOVEMENTS' },
  { label: 'Locales', icon: 'store', route: '/app/locales', group: 'Almacén', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.localesView] },

  // Abastecimiento — ADMIN
  { label: 'Proveedores', icon: 'local_shipping', route: '/app/suppliers', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.suppliersView], requiredFeature: 'SUPPLIERS' },
  { label: 'Ingreso de mercadería', icon: 'move_to_inbox', route: '/app/goods-receipts', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.goodsReceiptsView], requiredFeature: 'GOODS_RECEIPTS' },
  { label: 'Reabastecimiento', icon: 'insights', route: '/app/replenishment', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' },

  // Empresa — ADMIN
  { label: 'Mi empresa', icon: 'apartment', route: '/app/company', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyProfileView] },
  { label: 'Mi plan', icon: 'workspace_premium', route: '/app/plan', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyPlanView] },
  { label: 'Usuarios', icon: 'people', route: '/app/users', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.usersView] },

  // Análisis y sistema
  { label: 'Reportes', icon: 'bar_chart', route: '/app/reports', group: 'Análisis', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS' },
  { label: 'Auditoría', icon: 'verified_user', route: '/app/audit', group: 'Análisis', permissions: [APP_PERMISSIONS.auditView], requiredFeature: 'AUDIT' },
  { label: 'Notificaciones', icon: 'notifications', route: '/app/notifications', group: 'Sistema', permissions: [APP_PERMISSIONS.notificationsView], requiredFeature: 'NOTIFICATIONS' },
  { label: 'Configuración', icon: 'settings', route: '/app/settings', group: 'Sistema', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.settingsManage] },
];

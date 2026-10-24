import { NavigationItem } from './navigation-item.model';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';

export const MAIN_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', permissions: [APP_PERMISSIONS.dashboardView] },

  { label: 'Empresas', icon: 'business', route: '/app/companies', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesView] },
  { label: 'Planes y precios', icon: 'sell', route: '/app/plans', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] },
  { label: 'Países y monedas', icon: 'public', route: '/app/countries', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesManage] },
  { label: 'Usuarios globales', icon: 'groups', route: '/app/users', group: 'Plataforma', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.usersView] },

  { label: 'Punto de venta', icon: 'shopping_cart', route: '/app/pos', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesCreate], requiredFeature: 'SALES' },
  { label: 'Ventas', icon: 'point_of_sale', route: '/app/sales', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesView], requiredFeature: 'SALES' },
  { label: 'Asistencia', icon: 'how_to_reg', route: '/app/attendance', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.attendanceView] },
  { label: 'Clientes', icon: 'badge', route: '/app/customers', group: 'Operaciones', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView], requiredFeature: 'CLIENTS' },

  { label: 'Productos', icon: 'inventory_2', route: '/app/products', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' },
  { label: 'Categorías', icon: 'category', route: '/app/categories', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.categoriesView], requiredFeature: 'CATEGORIES' },
  { label: 'Marcas', icon: 'branding_watermark', route: '/app/brands', group: 'Catálogo', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.brandsView], requiredFeature: 'BRANDS' },

  { label: 'Inventario', icon: 'warehouse', route: '/app/inventory', group: 'Almacén', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.inventoryView], requiredFeature: 'STOCK' },
  { label: 'Movimientos', icon: 'swap_vert', route: '/app/inventory/movements', group: 'Almacén', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.inventoryMovementsView], requiredFeature: 'INVENTORY_MOVEMENTS' },
  { label: 'Locales', icon: 'store', route: '/app/locales', group: 'Almacén', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.localesView] },

  { label: 'Proveedores', icon: 'local_shipping', route: '/app/suppliers', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.suppliersView], requiredFeature: 'SUPPLIERS' },
  { label: 'Ingreso de mercadería', icon: 'move_to_inbox', route: '/app/goods-receipts', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.goodsReceiptsView], requiredFeature: 'GOODS_RECEIPTS' },
  { label: 'Qué pedir y cuándo', icon: 'event_available', route: '/app/purchase-plan', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' },
  { label: 'Reabastecimiento', icon: 'insights', route: '/app/replenishment', group: 'Abastecimiento', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' },

  { label: 'Mi empresa', icon: 'apartment', route: '/app/company', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyProfileView] },
  { label: 'Mi plan', icon: 'workspace_premium', route: '/app/plan', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyPlanView] },
  { label: 'Usuarios', icon: 'people', route: '/app/users', group: 'Empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.usersView] },

  { label: 'Resumen', icon: 'dashboard_customize', route: '/app/reports', exact: true, group: 'Reportes', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS' },
  { label: 'Ventas', icon: 'trending_up', route: '/app/reports/sales', group: 'Reportes', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS' },
  { label: 'Productos', icon: 'leaderboard', route: '/app/reports/products', group: 'Reportes', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS' },
  { label: 'Caja y pagos', icon: 'point_of_sale', route: '/app/reports/cash', group: 'Reportes', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS_CASH' },
  { label: 'Clientes', icon: 'groups', route: '/app/reports/customers', group: 'Reportes', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS_CUSTOMERS' },
  { label: 'Equipo', icon: 'badge', route: '/app/reports/team', group: 'Reportes', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS_TEAM' },
  { label: 'Auditoría', icon: 'verified_user', route: '/app/audit', group: 'Análisis', permissions: [APP_PERMISSIONS.auditView], requiredFeature: 'AUDIT' },
  { label: 'Notificaciones', icon: 'notifications', route: '/app/notifications', group: 'Sistema', permissions: [APP_PERMISSIONS.notificationsView], requiredFeature: 'NOTIFICATIONS' },
  { label: 'Configuración', icon: 'settings', route: '/app/settings', group: 'Sistema', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.settingsManage] },
];

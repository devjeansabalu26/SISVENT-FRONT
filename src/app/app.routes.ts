import { Routes } from '@angular/router';
import { APP_PERMISSIONS } from './core/auth/constants/app-permission.constant';
import { authGuard } from './core/auth/guards/auth.guard';
import { permissionGuard } from './core/auth/guards/permission.guard';
import { planGuard } from './core/auth/guards/plan.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((routes) => routes.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then((component) => component.MainLayout),
    children: [
      { path: 'dashboard', canActivate: [permissionGuard], data: { permissions: [APP_PERMISSIONS.dashboardView] }, loadComponent: () => import('./features/dashboard/pages/dashboard-page').then((component) => component.DashboardPage) },
      { path: 'products/new', canActivate: [roleGuard, permissionGuard, planGuard], data: { roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' }, loadComponent: () => import('./features/products/pages/product-form-page').then((component) => component.ProductFormPage) },
      { path: 'products/:id/edit', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Editar producto', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' }, loadComponent: () => import('./features/products/pages/product-form-page').then((component) => component.ProductFormPage) },
      { path: 'products/:id', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Detalle de producto', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' }, loadComponent: () => import('./features/products/pages/product-detail-page').then((component) => component.ProductDetailPage) },
      { path: 'products', canActivate: [roleGuard, permissionGuard, planGuard], data: { roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.productsView], requiredFeature: 'PRODUCTS' }, loadComponent: () => import('./features/products/pages/product-list-page').then((component) => component.ProductListPage) },
      { path: 'categories', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Categorías', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.categoriesView], requiredFeature: 'CATEGORIES' }, loadComponent: () => import('./features/categories/pages/category-list-page').then((component) => component.CategoryListPage) },
      { path: 'brands', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Marcas', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.brandsView], requiredFeature: 'BRANDS' }, loadComponent: () => import('./features/brands/pages/brand-list-page').then((component) => component.BrandListPage) },
      { path: 'companies/new', canActivate: [roleGuard, permissionGuard], data: { title: 'Nueva empresa', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesManage] }, loadComponent: () => import('./features/companies/pages/company-form-page').then((component) => component.CompanyFormPage) },
      { path: 'companies/:id/edit', canActivate: [roleGuard, permissionGuard], data: { title: 'Editar empresa', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesManage] }, loadComponent: () => import('./features/companies/pages/company-form-page').then((component) => component.CompanyFormPage) },
      { path: 'companies/:id', canActivate: [roleGuard, permissionGuard], data: { title: 'Detalle de empresa', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesView] }, loadComponent: () => import('./features/companies/pages/company-detail-page').then((component) => component.CompanyDetailPage) },
      { path: 'companies', canActivate: [roleGuard, permissionGuard], data: { roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.companiesView] }, loadComponent: () => import('./features/companies/pages/company-list-page').then((component) => component.CompanyListPage) },
      { path: 'plans/new', canActivate: [roleGuard, permissionGuard], data: { title: 'Nuevo plan', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] }, loadComponent: () => import('./features/plans/pages/plan-form-page').then((component) => component.PlanFormPage) },
      { path: 'plans/:id/edit', canActivate: [roleGuard, permissionGuard], data: { title: 'Editar plan', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] }, loadComponent: () => import('./features/plans/pages/plan-form-page').then((component) => component.PlanFormPage) },
      { path: 'plans/:id', canActivate: [roleGuard, permissionGuard], data: { title: 'Detalle de plan', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] }, loadComponent: () => import('./features/plans/pages/plan-detail-page').then((component) => component.PlanDetailPage) },
      { path: 'plans', canActivate: [roleGuard, permissionGuard], data: { title: 'Planes y precios', roles: ['SUPERADMIN'], permissions: [APP_PERMISSIONS.plansManage] }, loadComponent: () => import('./features/plans/pages/plan-list-page').then((component) => component.PlanListPage) },
      { path: 'users/:id', canActivate: [roleGuard, permissionGuard], data: { title: 'Detalle de usuario', roles: ['SUPERADMIN', 'ADMIN'], permissions: [APP_PERMISSIONS.usersView] }, loadComponent: () => import('./features/users/pages/user-detail-page').then((component) => component.UserDetailPage) },
      { path: 'users', canActivate: [roleGuard, permissionGuard], data: { roles: ['SUPERADMIN', 'ADMIN'], permissions: [APP_PERMISSIONS.usersView] }, loadComponent: () => import('./features/users/pages/user-list-page').then((component) => component.UserListPage) },
      { path: 'customers/new', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'CLIENTS', title: 'Clientes', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView] }, loadComponent: () => import('./features/customers/pages/customer-form-page').then((component) => component.CustomerFormPage) },
      { path: 'customers/:id/edit', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'CLIENTS', title: 'Editar cliente', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView] }, loadComponent: () => import('./features/customers/pages/customer-form-page').then((component) => component.CustomerFormPage) },
      { path: 'customers/:id', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'CLIENTS', title: 'Detalle de cliente', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView] }, loadComponent: () => import('./features/customers/pages/customer-detail-page').then((component) => component.CustomerDetailPage) },
      { path: 'customers', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'CLIENTS', title: 'Clientes', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.customersView] }, loadComponent: () => import('./features/customers/pages/customer-list-page').then((component) => component.CustomerListPage) },
      { path: 'sales/:id/comprobante', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'SALES', title: 'Comprobante', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesView] }, loadComponent: () => import('./features/sales/pages/receipt-page').then((component) => component.ReceiptPage) },
      { path: 'sales/:id', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'SALES', title: 'Detalle de venta', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesView] }, loadComponent: () => import('./features/sales/pages/sale-detail-page').then((component) => component.SaleDetailPage) },
      { path: 'sales', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'SALES', title: 'Ventas', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesView] }, loadComponent: () => import('./features/sales/pages/sale-list-page').then((component) => component.SaleListPage) },
      { path: 'pos', canActivate: [roleGuard, permissionGuard, planGuard], data: { requiredFeature: 'SALES', title: 'Punto de venta', roles: ['ADMIN', 'VENDEDOR'], permissions: [APP_PERMISSIONS.salesCreate] }, loadComponent: () => import('./features/sales/pages/pos-page').then((component) => component.PosPage) },
      { path: 'inventory/movements', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Movimientos de inventario', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.inventoryView], requiredFeature: 'INVENTORY_MOVEMENTS' }, loadComponent: () => import('./features/inventory/pages/inventory-movements-page').then((component) => component.InventoryMovementsPage) },
      { path: 'inventory', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Inventario', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.inventoryView], requiredFeature: 'STOCK' }, loadComponent: () => import('./features/inventory/pages/inventory-page').then((component) => component.InventoryPage) },
      { path: 'suppliers/new', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Nuevo proveedor', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.suppliersManage], requiredFeature: 'SUPPLIERS' }, loadComponent: () => import('./features/suppliers/pages/supplier-form-page').then((component) => component.SupplierFormPage) },
      { path: 'suppliers/:id/edit', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Editar proveedor', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.suppliersManage], requiredFeature: 'SUPPLIERS' }, loadComponent: () => import('./features/suppliers/pages/supplier-form-page').then((component) => component.SupplierFormPage) },
      { path: 'suppliers', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Proveedores', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.suppliersView], requiredFeature: 'SUPPLIERS' }, loadComponent: () => import('./features/suppliers/pages/supplier-list-page').then((component) => component.SupplierListPage) },
      { path: 'goods-receipts/new', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Nuevo ingreso de mercadería', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.goodsReceiptsManage], requiredFeature: 'GOODS_RECEIPTS' }, loadComponent: () => import('./features/goods-receipts/pages/goods-receipt-form-page').then((component) => component.GoodsReceiptFormPage) },
      { path: 'goods-receipts/:id', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Detalle de ingreso', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.goodsReceiptsView], requiredFeature: 'GOODS_RECEIPTS' }, loadComponent: () => import('./features/goods-receipts/pages/goods-receipt-detail-page').then((component) => component.GoodsReceiptDetailPage) },
      { path: 'goods-receipts', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Ingreso de mercadería', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.goodsReceiptsView], requiredFeature: 'GOODS_RECEIPTS' }, loadComponent: () => import('./features/goods-receipts/pages/goods-receipt-list-page').then((component) => component.GoodsReceiptListPage) },
      { path: 'replenishment/stockout-risk', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Riesgo de agotamiento', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' }, loadComponent: () => import('./features/replenishment/pages/stockout-risk-page').then((component) => component.StockoutRiskPage) },
      { path: 'replenishment/abc', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Rotación y ABC', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'ABC_ANALYSIS' }, loadComponent: () => import('./features/replenishment/pages/abc-rotation-page').then((component) => component.AbcRotationPage) },
      { path: 'replenishment/stagnant', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Sin movimiento y exceso', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' }, loadComponent: () => import('./features/replenishment/pages/stagnant-stock-page').then((component) => component.StagnantStockPage) },
      { path: 'replenishment', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Reabastecimiento', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.replenishmentView], requiredFeature: 'SUPPLY_ANALYTICS' }, loadComponent: () => import('./features/replenishment/pages/replenishment-summary-page').then((component) => component.ReplenishmentSummaryPage) },
      { path: 'locales', canActivate: [roleGuard, permissionGuard], data: { title: 'Locales', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.localesView] }, loadComponent: () => import('./features/locales/pages/local-list-page').then((component) => component.LocalListPage) },
      { path: 'company', canActivate: [roleGuard, permissionGuard], data: { title: 'Mi empresa', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyProfileView] }, loadComponent: () => import('./features/company-profile/pages/company-profile-page').then((component) => component.CompanyProfilePage) },
      { path: 'upgrade', data: { title: 'Disponible en un plan superior' }, loadComponent: () => import('./features/company-plan/pages/plan-upgrade-page').then((component) => component.PlanUpgradePage) },
      { path: 'plan', canActivate: [roleGuard, permissionGuard], data: { title: 'Mi plan', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.companyPlanView] }, loadComponent: () => import('./features/company-plan/pages/company-plan-page').then((component) => component.CompanyPlanPage) },
      { path: 'reports', canActivate: [roleGuard, permissionGuard, planGuard], data: { title: 'Reportes', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.reportsView], requiredFeature: 'REPORTS' }, loadComponent: () => import('./features/reports/pages/reports-page').then((component) => component.ReportsPage) },
      { path: 'audit', canActivate: [permissionGuard, planGuard], data: { requiredFeature: 'AUDIT', title: 'Auditoría', permissions: [APP_PERMISSIONS.auditView] }, loadComponent: () => import('./features/audit/pages/audit-page').then((component) => component.AuditPage) },
      { path: 'notifications', canActivate: [permissionGuard, planGuard], data: { requiredFeature: 'NOTIFICATIONS', title: 'Notificaciones', permissions: [APP_PERMISSIONS.notificationsView] }, loadComponent: () => import('./features/notifications/pages/notifications-page').then((component) => component.NotificationsPage) },
      { path: 'settings', canActivate: [roleGuard, permissionGuard], data: { title: 'Configuración', roles: ['ADMIN'], permissions: [APP_PERMISSIONS.settingsManage] }, loadComponent: () => import('./features/settings/pages/settings-page').then((component) => component.SettingsPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/errors/pages/forbidden/forbidden-page').then(
        (component) => component.ForbiddenPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/pages/not-found/not-found-page').then(
        (component) => component.NotFoundPage,
      ),
  },
];

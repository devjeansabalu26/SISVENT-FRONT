/**
 * Funcionalidades de plan (tabla `features` del backend) que controlan el acceso a cada módulo.
 * Deben coincidir con el segundo argumento de `ITenantAccess.RequireAsync(permiso, feature)` en el backend:
 * si el plan vigente no incluye la funcionalidad, el backend responde 403.
 */
export const PLAN_FEATURES = {
  sales: 'SALES',
  clients: 'CLIENTS',
  products: 'PRODUCTS',
  categories: 'CATEGORIES',
  brands: 'BRANDS',
  stock: 'STOCK',
  inventoryMovements: 'INVENTORY_MOVEMENTS',
  suppliers: 'SUPPLIERS',
  goodsReceipts: 'GOODS_RECEIPTS',
  supplyAnalytics: 'SUPPLY_ANALYTICS',
  abcAnalysis: 'ABC_ANALYSIS',
  reports: 'REPORTS',
  audit: 'AUDIT',
  notifications: 'NOTIFICATIONS',
} as const;

/** Nombre del módulo para la pantalla "Disponible en un plan superior". */
export const PLAN_FEATURE_LABELS: Readonly<Record<string, string>> = {
  SALES: 'Ventas y punto de venta',
  CLIENTS: 'Clientes',
  PRODUCTS: 'Productos',
  CATEGORIES: 'Categorías',
  BRANDS: 'Marcas',
  STOCK: 'Inventario',
  INVENTORY_MOVEMENTS: 'Movimientos de inventario',
  SUPPLIERS: 'Proveedores',
  GOODS_RECEIPTS: 'Ingreso de mercadería',
  SUPPLY_ANALYTICS: 'Abastecimiento y rotación',
  ABC_ANALYSIS: 'Clasificación ABC',
  REPORTS: 'Reportes',
  AUDIT: 'Auditoría',
  NOTIFICATIONS: 'Notificaciones',
};

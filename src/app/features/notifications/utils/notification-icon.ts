import { ApiNotification } from '../models/notification-item.model';

export type NotificationTone = 'danger' | 'warning' | 'info' | 'muted';

const BY_TYPE: Readonly<Record<string, string>> = {
  LOW_STOCK: 'inventory_2',
  OUT_OF_STOCK: 'remove_shopping_cart',
};

const BY_REFERENCE: Readonly<Record<string, string>> = {
  products: 'inventory_2',
  sales: 'receipt_long',
  cash_sessions: 'point_of_sale',
  purchase_plan: 'shopping_cart',
  stores: 'storefront',
  companies: 'business',
  user_profiles: 'person',
  plans: 'workspace_premium',
  company_plan_periods: 'workspace_premium',
};

const BY_PRIORITY: Readonly<Record<string, string>> = {
  ALTA: 'error_outline',
  MEDIA: 'warning_amber',
  INFO: 'info',
  SISTEMA: 'settings',
};

const TONE: Readonly<Record<string, NotificationTone>> = {
  ALTA: 'danger',
  MEDIA: 'warning',
  INFO: 'info',
  SISTEMA: 'muted',
};

export function notificationIcon(item: Pick<ApiNotification, 'type' | 'referenceType' | 'priority'>): string {
  return BY_TYPE[item.type] ?? (item.referenceType ? BY_REFERENCE[item.referenceType] : undefined) ?? BY_PRIORITY[item.priority] ?? 'notifications';
}

export function notificationTone(priority: string): NotificationTone {
  return TONE[priority] ?? 'info';
}

export function notificationRoute(item: Pick<ApiNotification, 'type' | 'referenceType' | 'referenceId' | 'companyId'>, superadmin: boolean): string[] {
  const id = item.referenceId;
  switch (item.referenceType) {
    case 'products':
      return item.type === 'LOW_STOCK' ? ['/app/inventory'] : id ? ['/app/products', id] : ['/app/notifications'];
    case 'sales':
      return id ? ['/app/sales', id] : ['/app/sales'];
    case 'cash_sessions':
      return ['/app/sales/cash'];
    case 'purchase_plan':
      return ['/app/purchase-plan'];
    case 'stores':
      return ['/app/attendance'];
    case 'companies':
      return id ? ['/app/companies', id] : ['/app/notifications'];
    case 'user_profiles':
      return id ? ['/app/users', id] : ['/app/notifications'];
    case 'plans':
    case 'company_plan_periods':
      return superadmin ? (item.companyId ? ['/app/companies', item.companyId] : ['/app/notifications']) : ['/app/plan'];
    default:
      return ['/app/notifications'];
  }
}

import { Customer, CustomerDetail } from '../models/customer.model';

export function toCustomer(detail: CustomerDetail): Customer {
  return {
    id: detail.id,
    type: detail.type,
    displayName: detail.displayName,
    documentType: detail.documentType,
    documentNumber: detail.documentNumber,
    email: detail.email,
    phone: detail.phone,
    totalPurchases: detail.totalAmount,
    lastPurchaseAt: detail.lastPurchaseAt,
    isActive: detail.isActive,
    version: detail.version,
  };
}

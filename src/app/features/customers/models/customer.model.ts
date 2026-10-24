export interface Customer {
  readonly id: string;
  readonly type: 'PERSON' | 'COMPANY';
  readonly displayName: string;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly totalPurchases: number;
  readonly lastPurchaseAt: string | null;
  readonly isActive: boolean;
  readonly version: number;
}

export interface CustomerPage {
  readonly items: readonly Customer[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

export interface CustomerDetail {
  readonly id: string;
  readonly type: 'PERSON' | 'COMPANY';
  readonly displayName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly purchaseCount: number;
  readonly totalAmount: number;
  readonly lastPurchaseAt: string | null;
  readonly averageTicket: number;
  readonly version: number;
}

export interface CustomerSummary {
  readonly total: number;
  readonly active: number;
  readonly newThisMonth: number;
  readonly averagePurchases: number;
}

export interface CustomerFormValue {
  readonly displayName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly documentType: string | null;
  readonly documentNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
}

export interface CustomerPurchasedItem {
  readonly saleId: string;
  readonly saleNumber: string;
  readonly saleDate: string;
  readonly status: string;
  readonly storeName: string;
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly category: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly subtotal: number;
}

export interface CustomerProductSummary {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string | null;
  readonly purchases: number;
  readonly units: number;
  readonly amount: number;
  readonly averagePrice: number;
  readonly lastPurchaseAt: string;
}

export interface CustomerPurchases {
  readonly items: readonly CustomerPurchasedItem[];
  readonly products: readonly CustomerProductSummary[];
  readonly truncated: boolean;
}

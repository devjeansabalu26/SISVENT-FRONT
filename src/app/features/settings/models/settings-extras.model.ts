export type TaxRegime = 'RUS' | 'RER' | 'RMT' | 'GENERAL';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TicketFormat = 'TICKET_80' | 'TICKET_58' | 'A4';

export interface SettingsExtras {
  readonly taxRegime: TaxRegime;
  readonly receiptSeries: string;
  readonly invoiceSeries: string;
  readonly dateFormat: DateFormat;
  readonly autoPrintReceipt: boolean;
  readonly soundEffects: boolean;
  readonly offlineMode: boolean;
  readonly maxDiscountPercent: number;
  readonly ticketFormat: TicketFormat;
  readonly pricesIncludeTax: boolean;
  readonly showLogoOnReceipt: boolean;
  readonly receiptFooter: string | null;
  readonly autoEmailReceipt: boolean;
  readonly notificationEmail: string | null;
  readonly emailChannel: boolean;
  readonly inAppChannel: boolean;
  readonly notifyPlanExpiry: boolean;
  readonly notifyCancelledSale: boolean;
  readonly notifyDailySummary: boolean;
  readonly strongPasswords: boolean;
  readonly passwordExpiryDays: number;
  readonly inactivityLogoutMinutes: number;
}

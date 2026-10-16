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
  readonly workDays: string;
  readonly workStartTime: string;
  readonly workEndTime: string;
  readonly lateToleranceMinutes: number;
  readonly cashDifferenceAlert: number;
  readonly notifyUnattendedStore: boolean;
}

export const WEEK_DAYS: readonly { readonly value: number; readonly label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

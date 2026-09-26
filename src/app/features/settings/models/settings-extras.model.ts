/**
 * Parámetros ampliados de `ad-configuracion` (SCR-AD-22) y de las pestañas Facturación / Notificaciones /
 * Seguridad. Vienen en el mismo `/api/v1/settings` (columnas de `005_company_settings_extended.sql`).
 */
export type TaxRegime = 'RUS' | 'RER' | 'RMT' | 'GENERAL';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TicketFormat = 'TICKET_80' | 'TICKET_58' | 'A4';

export interface SettingsExtras {
  // General — Datos fiscales
  readonly taxRegime: TaxRegime;
  readonly receiptSeries: string;
  readonly invoiceSeries: string;
  // General — Preferencias regionales
  readonly dateFormat: DateFormat;
  // General — Punto de venta
  readonly autoPrintReceipt: boolean;
  readonly soundEffects: boolean;
  readonly offlineMode: boolean;
  readonly maxDiscountPercent: number;
  // Facturación
  readonly ticketFormat: TicketFormat;
  readonly pricesIncludeTax: boolean;
  readonly showLogoOnReceipt: boolean;
  /** `null` al leer si no hay mensaje; al guardar, `''` lo borra. */
  readonly receiptFooter: string | null;
  // Notificaciones
  /** `null` al leer si no hay correo; al guardar, `''` lo borra. */
  readonly notificationEmail: string | null;
  readonly emailChannel: boolean;
  readonly inAppChannel: boolean;
  readonly notifyPlanExpiry: boolean;
  readonly notifyCancelledSale: boolean;
  readonly notifyDailySummary: boolean;
  // Seguridad
  readonly strongPasswords: boolean;
  readonly passwordExpiryDays: number;
  readonly inactivityLogoutMinutes: number;
}

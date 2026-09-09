/** Mirrors SettingsResponse / UpdateSettingsRequest from /api/v1/settings. */
export interface CompanySettings {
  readonly currencyCode: string;
  readonly locale: string;
  readonly timezone: string;
  readonly strictStockControl: boolean;
  readonly lowStockAlertEnabled: boolean;
  readonly notifyManualAdjustment: boolean;
  readonly version: number;
}

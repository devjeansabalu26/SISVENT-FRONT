import { SettingsExtras } from './settings-extras.model';

/** Mirrors SettingsResponse / UpdateSettingsRequest from /api/v1/settings. */
export interface CompanySettings extends SettingsExtras {
  readonly currencyCode: string;
  readonly locale: string;
  readonly timezone: string;
  readonly strictStockControl: boolean;
  readonly lowStockAlertEnabled: boolean;
  readonly notifyManualAdjustment: boolean;
  readonly version: number;
  /** Solo en la respuesta: fecha ISO del último guardado. */
  readonly updatedAt?: string;
}

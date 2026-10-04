import { SettingsExtras } from './settings-extras.model';

export interface CompanySettings extends SettingsExtras {
  readonly currencyCode: string;
  readonly locale: string;
  readonly timezone: string;
  readonly strictStockControl: boolean;
  readonly lowStockAlertEnabled: boolean;
  readonly notifyManualAdjustment: boolean;
  readonly version: number;
  readonly updatedAt?: string;
}

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Canonical 6-digit hex color, always `#RRGGBB`. */
export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Max length of a canonical hex color string, including the leading `#`. */
export const HEX_COLOR_MAX_LENGTH = 7;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

/** Reactive Forms validator: fails with `{ hexColor: true }` when the value is not `#RRGGBB`. */
export const hexColorValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  isHexColor(control.value) ? null : { hexColor: true };

/**
 * Normalizes free typing into a canonical hex string: forces a single leading `#`,
 * drops non-hex characters, uppercases, and caps the length at `#RRGGBB`.
 * Returns the cleaned value; callers push it back into the control.
 */
export function normalizeHexInput(raw: string): string {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
  return `#${hex}`;
}

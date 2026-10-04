import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const HEX_COLOR_MAX_LENGTH = 7;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

export const hexColorValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  isHexColor(control.value) ? null : { hexColor: true };

export function normalizeHexInput(raw: string): string {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
  return `#${hex}`;
}

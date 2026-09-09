import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { CompanyTheme } from './company-theme.model';

const THEME_PROPERTIES: Readonly<Record<keyof CompanyTheme, string>> = {
  primary: '--color-primary',
  secondary: '--color-secondary',
  accent: '--color-accent',
  background: '--color-background',
  surface: '--color-surface',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  primaryHover: '--color-primary-hover',
  primarySoft: '--color-primary-soft',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  apply(theme: CompanyTheme): void {
    const root = this.document.documentElement;
    const css = this.document.defaultView?.CSS;

    for (const key of Object.keys(THEME_PROPERTIES) as (keyof CompanyTheme)[]) {
      const value = theme[key];
      if (value && (!css || css.supports('color', value))) {
        root.style.setProperty(THEME_PROPERTIES[key], value);
      }
    }
  }

  reset(): void {
    const root = this.document.documentElement;
    Object.values(THEME_PROPERTIES).forEach((property) => root.style.removeProperty(property));
  }

  setPrimaryColor(color: string): void {
    this.apply({ primary: color });
  }

  setSecondaryColor(color: string): void {
    this.apply({ secondary: color });
  }
}

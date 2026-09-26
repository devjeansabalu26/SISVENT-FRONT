import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { prefersDarkTextOn } from '../../shared/utils/contrast-color';
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
  // El sidebar (sidebar.scss) lee estas cuatro, no --color-primary/secondary/accent directamente.
  sidebarBg: '--color-sidebar-bg',
  sidebarText: '--color-sidebar-text',
  sidebarActive: '--color-sidebar-active',
  onPrimary: '--color-on-primary',
};

/** Texto oscuro/claro ya existentes en los design tokens (_theme.scss) — no se inventan hex nuevos. */
const DARK_TEXT = '#334155'; // --color-text-secondary
const LIGHT_TEXT = '#94a3b8'; // --color-text-disabled / color por defecto del sidebar

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** Setea variables CSS 1:1 (sin derivar nada). Ignora valores con formato inválido. */
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

  /**
   * Theme real de una empresa (company_themes): deriva las variables del sidebar y el contraste de
   * texto a partir de los 4 colores guardados, y las aplica junto con el resto. Ver AA/AC/AD/AH/22.
   *   secondaryColor → fondo del sidebar
   *   primaryColor   → elemento activo / botones principales
   *   accentColor    → estados secundarios
   *   backgroundColor→ fondo del área principal
   */
  applyCompanyTheme(colors: {
    readonly primary?: string | null;
    readonly secondary?: string | null;
    readonly accent?: string | null;
    readonly background?: string | null;
  }): void {
    const secondary = colors.secondary ?? undefined;
    const primary = colors.primary ?? undefined;

    this.apply({
      primary,
      secondary,
      accent: colors.accent ?? undefined,
      background: colors.background ?? undefined,
      sidebarBg: secondary,
      sidebarActive: primary,
      sidebarText: secondary ? this.textFor(secondary) : undefined,
      onPrimary: primary ? this.textFor(primary) : undefined,
    });
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

  /** Texto oscuro si el fondo es claro; texto claro si el fondo es oscuro. Nunca asume blanco fijo. */
  private textFor(backgroundHex: string): string {
    const dark = prefersDarkTextOn(backgroundHex);
    if (dark === null) return LIGHT_TEXT; // hex inválido: no forzar contraste, cae al token por defecto
    return dark ? DARK_TEXT : LIGHT_TEXT;
  }
}

import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ensureContrast, mixColors, prefersDarkTextOn } from '../../shared/utils/contrast-color';
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
  sidebarStrong: '--color-sidebar-strong',
  sidebarHover: '--color-sidebar-hover-bg',
  onPrimary: '--color-on-primary',
};

/** Texto oscuro/claro ya existentes en los design tokens (_theme.scss) — no se inventan hex nuevos. */
const DARK_TEXT = '#334155'; // --color-text-secondary
const LIGHT_TEXT = '#94a3b8'; // --color-text-disabled / color por defecto del sidebar
/** Fondo por defecto del sidebar (--color-sidebar-bg en _theme.scss). */
const DEFAULT_SIDEBAR_BG = '#0f172a';

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
    const sidebarBg = secondary ?? DEFAULT_SIDEBAR_BG;
    const darkSidebar = prefersDarkTextOn(sidebarBg) === false;

    this.apply({
      primary,
      secondary,
      accent: colors.accent ?? undefined,
      background: colors.background ?? undefined,
      sidebarBg: secondary,
      // El acento del sidebar (ítem activo, rol) es el color de la empresa, aclarado/oscurecido solo lo
      // necesario para leerse sobre el fondo del sidebar (WCAG AA 4.5:1).
      sidebarActive: primary ? (ensureContrast(primary, sidebarBg) ?? primary) : undefined,
      sidebarText: secondary ? (ensureContrast(this.textFor(secondary), secondary) ?? this.textFor(secondary)) : undefined,
      // Fondo oscuro: igual que el diseño base (blanco + hover aclarado 18 %). Fondo claro: texto oscuro y hover oscurecido.
      sidebarStrong: darkSidebar ? '#FFFFFF' : '#0F172A',
      sidebarHover: (darkSidebar ? mixColors(sidebarBg, '#FFFFFF', 0.18) : mixColors(sidebarBg, '#000000', 0.08)) ?? undefined,
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

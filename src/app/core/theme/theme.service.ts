import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
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
  sidebarBg: '--color-sidebar-bg',
  sidebarText: '--color-sidebar-text',
  sidebarActive: '--color-sidebar-active',
  sidebarStrong: '--color-sidebar-strong',
  sidebarHover: '--color-sidebar-hover-bg',
  onPrimary: '--color-on-primary',
};

const DARK_ONLY_PROPERTIES = [
  '--color-surface-secondary',
  '--color-border',
  '--color-border-strong',
  '--color-text-muted',
  '--color-text-disabled',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
] as const;

const DARK_TEXT = '#334155'; // --color-text-secondary
const LIGHT_TEXT = '#94a3b8'; // --color-text-disabled / color por defecto del sidebar
const DEFAULT_SIDEBAR_BG = '#0f172a';
const DEFAULT_PRIMARY = '#2563EB';
const DEFAULT_ACCENT = '#10B981';

const NIGHT_BACKGROUND = '#0B1020';
const NIGHT_SURFACE = '#151B2B';
const NIGHT_TEXT = { primary: '#E8ECF4', secondary: '#C5CCDA', muted: '#929CB1', disabled: '#667085' };

const MODE_STORAGE_KEY = 'sisvent.theme-mode';

export type ThemeMode = 'light' | 'dark';

interface CompanyColors {
  readonly primary?: string | null;
  readonly secondary?: string | null;
  readonly accent?: string | null;
  readonly background?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private company: CompanyColors | null = null;

  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    this.render();
  }

  apply(theme: CompanyTheme): void {
    const vars: Record<string, string | undefined> = {};
    for (const key of Object.keys(THEME_PROPERTIES) as (keyof CompanyTheme)[]) vars[THEME_PROPERTIES[key]] = theme[key];
    this.setVars(vars);
  }

  applyCompanyTheme(colors: CompanyColors): void {
    this.company = colors;
    this.render();
  }

  reset(): void {
    this.company = null;
    this.render();
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      this.document.defaultView?.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
    }
    this.render();
  }

  toggleMode(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setPrimaryColor(color: string): void {
    this.apply({ primary: color });
  }

  setSecondaryColor(color: string): void {
    this.apply({ secondary: color });
  }

  private render(): void {
    const root = this.document.documentElement;
    Object.values(THEME_PROPERTIES).forEach((property) => root.style.removeProperty(property));
    DARK_ONLY_PROPERTIES.forEach((property) => root.style.removeProperty(property));

    const dark = this.mode() === 'dark';
    root.dataset['theme'] = this.mode();
    root.style.colorScheme = dark ? 'dark' : 'light';

    if (dark) this.setVars(this.nightPalette(this.company ?? {}));
    else if (this.company) this.setVars(this.dayPalette(this.company));
  }

  private dayPalette(colors: CompanyColors): Record<string, string | undefined> {
    const secondary = colors.secondary ?? undefined;
    const primary = colors.primary ?? undefined;
    const sidebarBg = secondary ?? DEFAULT_SIDEBAR_BG;
    const darkSidebar = prefersDarkTextOn(sidebarBg) === false;

    return {
      '--color-primary': primary,
      '--color-secondary': secondary,
      '--color-accent': colors.accent ?? undefined,
      '--color-primary-hover': primary ? (mixColors(primary, '#000000', 0.12) ?? undefined) : undefined,
      '--color-primary-soft': primary ? (mixColors(primary, '#FFFFFF', 0.9) ?? undefined) : undefined,
      '--color-sidebar-bg': secondary,
      '--color-sidebar-active': primary ? (ensureContrast(primary, sidebarBg) ?? primary) : undefined,
      '--color-sidebar-text': secondary ? (ensureContrast(this.textFor(secondary), secondary) ?? this.textFor(secondary)) : undefined,
      '--color-sidebar-strong': darkSidebar ? '#FFFFFF' : '#0F172A',
      '--color-sidebar-hover-bg': (darkSidebar ? mixColors(sidebarBg, '#FFFFFF', 0.18) : mixColors(sidebarBg, '#000000', 0.08)) ?? undefined,
      '--color-on-primary': primary ? this.onColor(primary) : undefined,
    };
  }

  private nightPalette(colors: CompanyColors): Record<string, string | undefined> {
    const brand = colors.primary ?? DEFAULT_PRIMARY;
    const secondary = colors.secondary ?? DEFAULT_SIDEBAR_BG;
    const darkBrand = prefersDarkTextOn(secondary) === false;
    const background = (darkBrand
      ? mixColors(secondary, '#000000', 0.55)
      : mixColors(NIGHT_BACKGROUND, brand, 0.06)) ?? NIGHT_BACKGROUND;
    const surface = (darkBrand
      ? mixColors(background, '#FFFFFF', 0.07)
      : mixColors(NIGHT_SURFACE, brand, 0.08)) ?? NIGHT_SURFACE;
    const primary = ensureContrast(brand, surface, 4.5) ?? brand;
    const accentBase = colors.accent ?? DEFAULT_ACCENT;
    const accent = ensureContrast(accentBase, surface, 3) ?? accentBase;

    const sidebarBg = mixColors(background, '#000000', 0.35) ?? background;

    return {
      '--color-primary': primary,
      '--color-primary-hover': mixColors(primary, '#FFFFFF', 0.12) ?? primary,
      '--color-primary-soft': mixColors(surface, primary, 0.18) ?? surface,
      '--color-secondary': mixColors(secondary, '#FFFFFF', 0.35) ?? secondary,
      '--color-accent': accent,
      '--color-background': background,
      '--color-surface': surface,
      '--color-surface-secondary': mixColors(surface, '#FFFFFF', 0.05) ?? surface,
      '--color-border': mixColors(surface, '#FFFFFF', 0.1) ?? surface,
      '--color-border-strong': mixColors(surface, '#FFFFFF', 0.2) ?? surface,
      '--color-text-primary': NIGHT_TEXT.primary,
      '--color-text-secondary': NIGHT_TEXT.secondary,
      '--color-text-muted': NIGHT_TEXT.muted,
      '--color-text-disabled': NIGHT_TEXT.disabled,
      '--color-sidebar-bg': sidebarBg,
      '--color-sidebar-active': ensureContrast(brand, sidebarBg) ?? primary,
      '--color-sidebar-text': ensureContrast(LIGHT_TEXT, sidebarBg) ?? LIGHT_TEXT,
      '--color-sidebar-strong': '#FFFFFF',
      '--color-sidebar-hover-bg': mixColors(sidebarBg, '#FFFFFF', 0.12) ?? sidebarBg,
      '--color-on-primary': this.onColor(primary),
      '--shadow-sm': '0 1px 2px rgb(0 0 0 / 35%)',
      '--shadow-md': '0 4px 14px rgb(0 0 0 / 40%)',
      '--shadow-lg': '0 16px 36px rgb(0 0 0 / 50%)',
    };
  }

  private setVars(vars: Record<string, string | undefined>): void {
    const root = this.document.documentElement;
    const css = this.document.defaultView?.CSS;
    for (const [property, value] of Object.entries(vars)) {
      if (value && (!css || css.supports('color', value) || property.startsWith('--shadow'))) {
        root.style.setProperty(property, value);
      }
    }
  }

  private initialMode(): ThemeMode {
    const view = this.document.defaultView;
    try {
      const saved = view?.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
    }
    return view?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private onColor(backgroundHex: string): string {
    return prefersDarkTextOn(backgroundHex) ? '#0F172A' : '#FFFFFF';
  }

  private textFor(backgroundHex: string): string {
    const dark = prefersDarkTextOn(backgroundHex);
    if (dark === null) return LIGHT_TEXT; // hex inválido: no forzar contraste, cae al token por defecto
    return dark ? DARK_TEXT : LIGHT_TEXT;
  }
}

export interface CompanyTheme {
  readonly primary?: string;
  readonly secondary?: string;
  readonly accent?: string;
  readonly background?: string;
  readonly surface?: string;
  readonly textPrimary?: string;
  readonly textSecondary?: string;
  readonly primaryHover?: string;
  readonly primarySoft?: string;
  // Consola de navegación lateral: antes NINGUNA de estas cuatro las tocaba ThemeService — el sidebar
  // usa su propio set de variables (--color-sidebar-*), separado de --color-primary/secondary/accent,
  // por eso los colores de la empresa no llegaban a verse ahí aunque el resto del theme sí se aplicara.
  readonly sidebarBg?: string;
  readonly sidebarText?: string;
  readonly sidebarActive?: string;
  readonly onPrimary?: string;
}

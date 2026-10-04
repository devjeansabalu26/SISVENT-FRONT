export interface CompanyThemePreset {
  readonly id: string;
  readonly name: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
}

export const COMPANY_THEME_PRESETS: readonly CompanyThemePreset[] = [
  {
    id: 'default',
    name: 'Default — Blue',
    primaryColor: '#2563EB',
    secondaryColor: '#1E293B',
    accentColor: '#10B981',
    backgroundColor: '#F3F4F6',
  },
  {
    id: 'purple-trend',
    name: 'Purple',
    primaryColor: '#7C3AED',
    secondaryColor: '#2E1065',
    accentColor: '#C084FC',
    backgroundColor: '#F5F3FF',
  },
  {
    id: 'ocean-blue',
    name: 'Sky Blue',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0C4A6E',
    accentColor: '#22D3EE',
    backgroundColor: '#F0F9FF',
  },
  {
    id: 'emerald-mint',
    name: 'Emerald',
    primaryColor: '#059669',
    secondaryColor: '#064E3B',
    accentColor: '#34D399',
    backgroundColor: '#ECFDF5',
  },
  {
    id: 'warm-sunset',
    name: 'Orange',
    primaryColor: '#EA580C',
    secondaryColor: '#7C2D12',
    accentColor: '#FBBF24',
    backgroundColor: '#FFF7ED',
  },
  {
    id: 'carbon-noir',
    name: 'Carbon Noir',
    primaryColor: '#3B82F6',
    secondaryColor: '#111827',
    accentColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
];

export const DEFAULT_COMPANY_THEME_PRESET = COMPANY_THEME_PRESETS[0];

export type CompanyThemeColors = Pick<
  CompanyThemePreset,
  'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor'
>;

export function matchThemePreset(colors: CompanyThemeColors): CompanyThemePreset | null {
  const normalized = {
    primaryColor: colors.primaryColor?.toUpperCase(),
    secondaryColor: colors.secondaryColor?.toUpperCase(),
    accentColor: colors.accentColor?.toUpperCase(),
    backgroundColor: colors.backgroundColor?.toUpperCase(),
  };
  return (
    COMPANY_THEME_PRESETS.find(
      (preset) =>
        preset.primaryColor === normalized.primaryColor &&
        preset.secondaryColor === normalized.secondaryColor &&
        preset.accentColor === normalized.accentColor &&
        preset.backgroundColor === normalized.backgroundColor,
    ) ?? null
  );
}

export type SoundKind = 'sale' | 'success' | 'error' | 'warning' | 'info' | 'notification';

export type SoundToneId = 'clasico' | 'suave' | 'campana' | 'digital' | 'moneda';

export interface SoundPreferences {
  readonly enabled: boolean;
  readonly tone: SoundToneId;
  readonly volume: number;
}

export interface SoundNote {
  readonly frequency: number;
  readonly start: number;
  readonly duration: number;
}

export interface SoundTone {
  readonly id: SoundToneId;
  readonly label: string;
  readonly description: string;
  readonly wave: OscillatorType;
  readonly pitch: number;
  readonly release: number;
  readonly gain: number;
  readonly partials: readonly number[];
}

export const SOUND_TONES: readonly SoundTone[] = [
  { id: 'clasico', label: 'Clásico', description: 'Tonos limpios y claros', wave: 'sine', pitch: 1, release: 0.18, gain: 0.5, partials: [] },
  { id: 'suave', label: 'Suave', description: 'Más bajo y discreto', wave: 'sine', pitch: 0.75, release: 0.32, gain: 0.35, partials: [] },
  { id: 'campana', label: 'Campana', description: 'Timbre de campanita', wave: 'sine', pitch: 1, release: 0.7, gain: 0.4, partials: [2, 3.01] },
  { id: 'digital', label: 'Digital', description: 'Pitidos cortos de lector', wave: 'square', pitch: 1, release: 0.08, gain: 0.12, partials: [] },
  { id: 'moneda', label: 'Moneda', description: 'Brillante, tipo caja registradora', wave: 'triangle', pitch: 1.5, release: 0.22, gain: 0.45, partials: [2] },
];

export const SOUND_KINDS: readonly { readonly kind: SoundKind; readonly label: string; readonly icon: string }[] = [
  { kind: 'sale', label: 'Venta registrada', icon: 'point_of_sale' },
  { kind: 'success', label: 'Confirmación', icon: 'check_circle' },
  { kind: 'error', label: 'Error', icon: 'error' },
  { kind: 'warning', label: 'Alerta', icon: 'warning' },
  { kind: 'info', label: 'Aviso', icon: 'info' },
  { kind: 'notification', label: 'Notificación nueva', icon: 'notifications_active' },
];

export const SOUND_PATTERNS: Readonly<Record<SoundKind, readonly SoundNote[]>> = {
  sale: [
    { frequency: 523.25, start: 0, duration: 0.09 },
    { frequency: 659.25, start: 0.08, duration: 0.09 },
    { frequency: 783.99, start: 0.16, duration: 0.09 },
    { frequency: 1046.5, start: 0.24, duration: 0.2 },
  ],
  success: [
    { frequency: 659.25, start: 0, duration: 0.09 },
    { frequency: 880, start: 0.09, duration: 0.16 },
  ],
  error: [
    { frequency: 329.63, start: 0, duration: 0.14 },
    { frequency: 220, start: 0.15, duration: 0.24 },
  ],
  warning: [
    { frequency: 587.33, start: 0, duration: 0.11 },
    { frequency: 587.33, start: 0.17, duration: 0.11 },
  ],
  info: [{ frequency: 783.99, start: 0, duration: 0.14 }],
  notification: [
    { frequency: 987.77, start: 0, duration: 0.12 },
    { frequency: 1318.51, start: 0.13, duration: 0.22 },
  ],
};

export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = { enabled: true, tone: 'clasico', volume: 0.6 };

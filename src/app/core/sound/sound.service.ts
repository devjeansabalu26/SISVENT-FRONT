import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DEFAULT_SOUND_PREFERENCES,
  SOUND_PATTERNS,
  SOUND_TONES,
  SoundKind,
  SoundPreferences,
  SoundTone,
  SoundToneId,
} from './sound.model';

const STORAGE_KEY = 'savix.sound';
const REPEAT_GAP_MS = 250;

@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly prefs = signal<SoundPreferences>(this.load());
  private context: AudioContext | null = null;
  private lastPlayed = new Map<SoundKind, number>();

  readonly preferences = this.prefs.asReadonly();
  readonly enabled = computed(() => this.prefs().enabled);
  readonly tones = SOUND_TONES;

  play(kind: SoundKind): void {
    const prefs = this.prefs();
    if (!prefs.enabled || prefs.volume <= 0) return;
    const now = Date.now();
    if (now - (this.lastPlayed.get(kind) ?? 0) < REPEAT_GAP_MS) return;
    this.lastPlayed.set(kind, now);
    this.render(kind, this.toneOf(prefs.tone), prefs.volume);
  }

  preview(kind: SoundKind, tone: SoundToneId = this.prefs().tone): void {
    this.render(kind, this.toneOf(tone), Math.max(this.prefs().volume, 0.05));
  }

  setEnabled(enabled: boolean): void {
    this.update({ enabled });
  }

  setTone(tone: SoundToneId): void {
    if (SOUND_TONES.some((item) => item.id === tone)) this.update({ tone });
  }

  setVolume(volume: number): void {
    this.update({ volume: Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : DEFAULT_SOUND_PREFERENCES.volume)) });
  }

  private update(change: Partial<SoundPreferences>): void {
    this.prefs.update((current) => ({ ...current, ...change }));
    try {
      this.view?.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs()));
    } catch {
      return;
    }
  }

  private load(): SoundPreferences {
    try {
      const raw = this.view?.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SOUND_PREFERENCES;
      const saved = JSON.parse(raw) as Partial<SoundPreferences>;
      return {
        enabled: typeof saved.enabled === 'boolean' ? saved.enabled : DEFAULT_SOUND_PREFERENCES.enabled,
        tone: SOUND_TONES.some((item) => item.id === saved.tone) ? (saved.tone as SoundToneId) : DEFAULT_SOUND_PREFERENCES.tone,
        volume: typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : DEFAULT_SOUND_PREFERENCES.volume,
      };
    } catch {
      return DEFAULT_SOUND_PREFERENCES;
    }
  }

  private toneOf(id: SoundToneId): SoundTone {
    return SOUND_TONES.find((item) => item.id === id) ?? SOUND_TONES[0];
  }

  private audio(): AudioContext | null {
    if (this.context) return this.context;
    const Ctor = this.view?.AudioContext ?? (this.view as unknown as { webkitAudioContext?: typeof AudioContext } | null)?.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.context = new Ctor();
    } catch {
      return null;
    }
    return this.context;
  }

  private render(kind: SoundKind, tone: SoundTone, volume: number): void {
    const ctx = this.audio();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const master = ctx.createGain();
    master.gain.value = tone.gain * volume;
    master.connect(ctx.destination);
    const base = ctx.currentTime + 0.01;
    let end = base;
    for (const note of SOUND_PATTERNS[kind]) {
      const start = base + note.start;
      const stop = start + note.duration + tone.release;
      end = Math.max(end, stop);
      for (const [index, multiple] of [1, ...tone.partials].entries()) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = tone.wave;
        osc.frequency.value = note.frequency * tone.pitch * multiple;
        const peak = index === 0 ? 1 : 0.35 / index;
        env.gain.setValueAtTime(0.0001, start);
        env.gain.exponentialRampToValueAtTime(peak, start + 0.012);
        env.gain.setValueAtTime(peak, start + note.duration * 0.6);
        env.gain.exponentialRampToValueAtTime(0.0001, stop);
        osc.connect(env).connect(master);
        osc.start(start);
        osc.stop(stop + 0.02);
      }
    }
    this.view?.setTimeout(() => master.disconnect(), Math.ceil((end - ctx.currentTime + 0.2) * 1000));
  }
}

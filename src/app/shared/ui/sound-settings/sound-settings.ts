import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { SoundService } from '../../../core/sound/sound.service';
import { SOUND_KINDS, SoundKind, SoundToneId } from '../../../core/sound/sound.model';

@Component({
  selector: 'app-sound-settings',
  templateUrl: './sound-settings.html',
  styleUrls: ['../../forms/switch.scss', './sound-settings.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class SoundSettings {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly sound = inject(SoundService);
  readonly full = input(false);
  readonly kinds = SOUND_KINDS;
  readonly open = signal(false);
  readonly prefs = this.sound.preferences;
  readonly volumePercent = computed(() => Math.round(this.prefs().volume * 100));
  readonly muted = computed(() => !this.prefs().enabled || this.prefs().volume === 0);
  readonly icon = computed(() => (this.muted() ? 'volume_off' : this.prefs().volume < 0.4 ? 'volume_down' : 'volume_up'));
  readonly label = computed(() => (this.muted() ? 'Sonidos en silencio' : 'Sonidos'));
  readonly toneLabel = computed(() => this.sound.tones.find((tone) => tone.id === this.prefs().tone)?.label ?? '');

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  setEnabled(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.sound.setEnabled(enabled);
    if (enabled) this.sound.preview('success');
  }

  setTone(event: Event): void {
    this.sound.setTone((event.target as HTMLSelectElement).value as SoundToneId);
    this.sound.preview('sale');
  }

  setVolume(event: Event): void {
    this.sound.setVolume(Number((event.target as HTMLInputElement).value) / 100);
  }

  previewVolume(): void {
    this.sound.preview('success');
  }

  test(kind: SoundKind): void {
    this.sound.preview(kind);
  }
}

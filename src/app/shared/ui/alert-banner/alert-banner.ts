import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertBannerTone = 'error' | 'warning' | 'info' | 'success';

const DEFAULT_ICON: Readonly<Record<AlertBannerTone, string>> = {
  error: 'gpp_bad',
  warning: 'warning_amber',
  info: 'info',
  success: 'check_circle',
};

/** Banner de alerta en línea (icono + título + descripción) — Figma `state-variations-canvas`. */
@Component({
  selector: 'app-alert-banner',
  template: `
    <div class="banner" [attr.data-tone]="tone()" role="alert">
      <span class="material-icons" aria-hidden="true">{{ resolvedIcon() }}</span>
      <div>
        <strong>{{ title() }}</strong>
        @if (message()) {
          <p>{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styles: `
    .banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid;
      border-radius: var(--radius-md);
      font-size: 13px;
    }
    .banner .material-icons { font-size: 20px; }
    .banner strong { display: block; font-weight: 700; }
    .banner p { margin: 2px 0 0; line-height: 1.45; }
    .banner[data-tone='error'] { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
    .banner[data-tone='warning'] { border-color: #fde68a; color: #b45309; background: #fffbeb; }
    .banner[data-tone='info'] { border-color: #bfdbfe; color: #1d4ed8; background: #eff6ff; }
    .banner[data-tone='success'] { border-color: #a7f3d0; color: #047857; background: #ecfdf5; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBanner {
  readonly tone = input<AlertBannerTone>('error');
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly resolvedIcon = computed(() => this.icon() ?? DEFAULT_ICON[this.tone()]);
}

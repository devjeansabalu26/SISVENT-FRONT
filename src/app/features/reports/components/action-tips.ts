import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ActionTip {
  readonly icon: string;
  readonly text: string;
}

@Component({
  selector: 'app-action-tips',
  template: `
    @if (tips().length) {
      <section class="tips" aria-label="Qué hacer">
        <h2>Qué hacer</h2>
        <ul>
          @for (tip of tips(); track tip.text) {
            <li><span class="material-icons" aria-hidden="true">{{ tip.icon }}</span><span>{{ tip.text }}</span></li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    :host { display: block; }
    .tips {
      display: grid; gap: 8px; margin: 16px 0; padding: 14px 16px;
      border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
    }
    h2 { margin: 0; font-size: 16px; }
    ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
    li { display: flex; gap: 8px; align-items: flex-start; color: var(--color-text-secondary); font-size: 15px; }
    .material-icons { flex: none; color: var(--color-primary); font-size: 18px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionTips {
  readonly tips = input.required<readonly ActionTip[]>();
}

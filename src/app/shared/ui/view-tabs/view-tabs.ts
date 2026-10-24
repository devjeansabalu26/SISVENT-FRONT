import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ViewTab {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
}

@Component({
  selector: 'app-view-tabs',
  template: `
    <nav class="view-tabs" [attr.aria-label]="label()" role="tablist">
      @for (tab of tabs(); track tab.id) {
        <button type="button" role="tab" class="view-tabs__tab" [class.view-tabs__tab--active]="tab.id === active()"
          [attr.aria-selected]="tab.id === active()" (click)="select.emit(tab.id)">
          @if (tab.icon) {
            <span class="material-icons" aria-hidden="true">{{ tab.icon }}</span>
          }
          {{ tab.label }}
        </button>
      }
    </nav>
  `,
  styles: `
    .view-tabs {
      display: flex; gap: 6px; margin-bottom: 18px; padding: 4px; overflow-x: auto;
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface);
      scrollbar-width: none;
    }
    .view-tabs::-webkit-scrollbar { display: none; }
    .view-tabs__tab {
      display: inline-flex; flex-shrink: 0; align-items: center; gap: 6px; padding: 8px 14px;
      border: 0; border-radius: var(--radius-md); color: var(--color-text-secondary); background: transparent;
      font-size: var(--font-size-sm); font-weight: 600; white-space: nowrap; cursor: pointer;
      transition: background-color .18s ease, color .18s ease;
    }
    .view-tabs__tab .material-icons { font-size: 18px; }
    .view-tabs__tab:hover { color: var(--color-text-primary); background: var(--color-surface-secondary); }
    .view-tabs__tab--active, .view-tabs__tab--active:hover { color: var(--color-primary); background: var(--color-primary-soft); }
    .view-tabs__tab:focus-visible { outline: none; box-shadow: var(--control-ring); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewTabs {
  readonly tabs = input.required<readonly ViewTab[]>();
  readonly active = input.required<string>();
  readonly label = input('Vistas');
  readonly select = output<string>();
}

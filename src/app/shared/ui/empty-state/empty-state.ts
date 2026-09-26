import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

/**
 * Empty state — Figma "Components Library · Row 5 · EMPTY STATE" and the `empty-states` frame.
 * Icon + title + description + optional CTA. Projected content replaces the default CTA button.
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Sin borde propio: para usarlo dentro de un contenedor que ya tiene borde (p. ej. `app-data-table`). */
  readonly flush = input(false, { transform: booleanAttribute });
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}

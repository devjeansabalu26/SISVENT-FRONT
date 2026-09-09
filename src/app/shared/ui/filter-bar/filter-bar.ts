import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Filter bar — Figma "Components Library · Row 8 · FILTER PANEL".
 * Search field + projected `<select>`/date controls + Limpiar / Filtrar actions.
 * Emits `search` on input (debounce is the caller's concern) and `clear` / `apply` on the buttons.
 */
@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  readonly searchPlaceholder = input('Buscar…');
  readonly showSearch = input(true);
  readonly showActions = input(true);
  readonly search = output<string>();
  readonly clear = output<void>();
  readonly apply = output<void>();
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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

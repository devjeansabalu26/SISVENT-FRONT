import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

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
  readonly flush = input(false, { transform: booleanAttribute });
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopLoadingBar } from './shared/ui/top-loading-bar/top-loading-bar';
import { ScrollHint } from './shared/ui/scroll-hint/scroll-hint';

function focusedNumberInput(target: EventTarget | null): HTMLInputElement | null {
  return target instanceof HTMLInputElement && target.type === 'number' && document.activeElement === target ? target : null;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopLoadingBar, ScrollHint],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:wheel)': 'onNumberWheel($event)',
    '(document:keydown)': 'onNumberArrow($event)',
  },
})
export class App {
  onNumberWheel(event: WheelEvent): void {
    focusedNumberInput(event.target)?.blur();
  }

  onNumberArrow(event: KeyboardEvent): void {
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && focusedNumberInput(event.target)) event.preventDefault();
  }
}

import { ChangeDetectionStrategy, Component, DOCUMENT, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopLoadingBar } from './shared/ui/top-loading-bar/top-loading-bar';
import { ScrollHint } from './shared/ui/scroll-hint/scroll-hint';
import { AccessControlService } from './core/auth/services/access-control.service';

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
  private readonly document = inject(DOCUMENT);
  private readonly access = inject(AccessControlService);
  private readonly demoNoPrint = effect(() =>
    this.document.body.classList.toggle('demo-no-print', this.access.isDemoCompany()),
  );

  onNumberWheel(event: WheelEvent): void {
    focusedNumberInput(event.target)?.blur();
  }

  onNumberArrow(event: KeyboardEvent): void {
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && focusedNumberInput(event.target)) event.preventDefault();
  }
}

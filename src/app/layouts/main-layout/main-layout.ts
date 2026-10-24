import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { DemoLockService } from '../../core/demo/demo-lock.service';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Header } from './header/header';
import { AttendanceEntryPromptService } from '../../features/attendance/utils/attendance-entry-prompt.service';
import { UserContextService } from '../../core/context/user-context/user-context.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeNavigation()' },
})
export class MainLayout {
  readonly navigationClosed = signal(true);
  private readonly attendancePrompt = inject(AttendanceEntryPromptService);
  private readonly users = inject(UserContextService);
  readonly readOnly = computed(() => !!this.users.user()?.readOnly);
  private readonly demoLock = inject(DemoLockService);

  constructor() {
    afterNextRender(() => this.attendancePrompt.checkOnEntry());
    effect(() => (this.readOnly() ? this.demoLock.start() : this.demoLock.stop()));
    inject(DestroyRef).onDestroy(() => this.demoLock.stop());
  }

  toggleNavigation(): void { this.navigationClosed.update((value) => !value); }
  closeNavigation(): void { this.navigationClosed.set(true); }
}

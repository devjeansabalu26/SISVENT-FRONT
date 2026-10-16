import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Header } from './header/header';
import { AttendanceEntryPromptService } from '../../features/attendance/utils/attendance-entry-prompt.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  readonly navigationClosed = signal(true);
  private readonly attendancePrompt = inject(AttendanceEntryPromptService);

  constructor() {
    afterNextRender(() => this.attendancePrompt.checkOnEntry());
  }

  toggleNavigation(): void { this.navigationClosed.update((value) => !value); }
  closeNavigation(): void { this.navigationClosed.set(true); }
}

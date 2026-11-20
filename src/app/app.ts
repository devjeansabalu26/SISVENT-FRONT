import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopLoadingBar } from './shared/ui/top-loading-bar/top-loading-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopLoadingBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

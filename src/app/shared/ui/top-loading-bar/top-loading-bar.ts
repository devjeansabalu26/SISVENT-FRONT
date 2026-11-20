import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoadingService } from '../../../core/loading/loading.service';

const SHOW_DELAY_MS = 150;

@Component({
  selector: 'app-top-loading-bar',
  template: `
    <div class="bar" [class.bar--on]="visible()" role="progressbar" aria-label="Cargando" [attr.aria-hidden]="!visible()">
      <span class="bar__run"></span>
    </div>
  `,
  styleUrl: './top-loading-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopLoadingBar {
  private readonly loading = inject(LoadingService);
  private readonly navigating = signal(false);
  private readonly active = computed(() => this.loading.isLoading() || this.navigating());
  readonly visible = signal(false);

  constructor() {
    const subscription = inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) this.navigating.set(true);
      else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.navigating.set(false);
      }
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const active = this.active();
      clearTimeout(timer);
      if (active) timer = setTimeout(() => this.visible.set(true), SHOW_DELAY_MS);
      else this.visible.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      clearTimeout(timer);
    });
  }
}

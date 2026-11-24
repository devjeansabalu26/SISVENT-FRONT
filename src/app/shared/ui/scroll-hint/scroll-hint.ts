import { ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HoldScroll, HoldScrollTarget } from './hold-scroll';
import { TableScrollHints } from './table-scroll-hints';

const MIN_SCROLL_PX = 40;
const EDGE_PX = 8;
const STEP_RATIO = 0.08;

@Component({
  selector: 'app-scroll-hint',
  template: `
    @if (canUp() || canDown()) {
      <span class="scroll-hint">
        @if (canUp()) {
          <span class="scroll-hint__shade scroll-hint__shade--top" aria-hidden="true"></span>
          <button type="button" class="scroll-hint__arrow scroll-hint__arrow--up" aria-label="Subir" title="Subir" (pointerdown)="press($event, -1)" (click)="keyboardMove($event, -1)" (contextmenu)="$event.preventDefault()"><span class="material-icons" aria-hidden="true">keyboard_arrow_up</span></button>
        }
        @if (canDown()) {
          <span class="scroll-hint__shade scroll-hint__shade--bottom" aria-hidden="true"></span>
          <button type="button" class="scroll-hint__arrow scroll-hint__arrow--down" aria-label="Bajar" title="Bajar" (pointerdown)="press($event, 1)" (click)="keyboardMove($event, 1)" (contextmenu)="$event.preventDefault()"><span class="material-icons" aria-hidden="true">keyboard_arrow_down</span></button>
        }
      </span>
    }
  `,
  styleUrl: './scroll-hint.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollHint {
  readonly canUp = signal(false);
  readonly canDown = signal(false);

  private readonly hold = new HoldScroll();
  private readonly pageTarget: HoldScrollTarget = {
    position: () => window.scrollY,
    scrollBy: (delta, smooth) => window.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'instant' }),
    step: () => window.innerHeight * STEP_RATIO,
  };

  press(event: PointerEvent, direction: 1 | -1): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.hold.press(this.pageTarget, direction);
  }

  keyboardMove(event: MouseEvent, direction: 1 | -1): void {
    if (event.detail !== 0) return;
    this.pageTarget.scrollBy(direction * this.pageTarget.step(), true);
  }

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let frame = 0;
      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const root = document.documentElement;
          const max = root.scrollHeight - window.innerHeight;
          const scrollable = max > MIN_SCROLL_PX;
          this.canUp.set(scrollable && window.scrollY > EDGE_PX);
          this.canDown.set(scrollable && window.scrollY < max - EDGE_PX);
        });
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      const observer = new ResizeObserver(update);
      observer.observe(document.body);
      const subscription = router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) update();
      });
      update();
      const tableHints = new TableScrollHints();
      tableHints.start();
      destroyRef.onDestroy(() => {
        tableHints.stop();
        this.hold.stop();
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        observer.disconnect();
        subscription.unsubscribe();
      });
    });
  }
}

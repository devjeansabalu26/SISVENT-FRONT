const TAP_MAX_MS = 200;
const HOLD_SPEED_PX_PER_SECOND = 650;
const STUCK_FRAMES = 6;

export interface HoldScrollTarget {
  readonly position: () => number;
  readonly scrollBy: (delta: number, smooth: boolean) => void;
  readonly step: () => number;
}

interface ActivePress {
  readonly target: HoldScrollTarget;
  readonly direction: 1 | -1;
  holding: boolean;
}

export class HoldScroll {
  private active: ActivePress | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | undefined;
  private frame = 0;
  private readonly onRelease = () => this.finish(true);
  private readonly onCancel = () => this.finish(false);

  press(target: HoldScrollTarget, direction: 1 | -1): void {
    this.stop();
    const active: ActivePress = { target, direction, holding: false };
    this.active = active;
    window.addEventListener('pointerup', this.onRelease);
    window.addEventListener('pointercancel', this.onCancel);
    window.addEventListener('blur', this.onCancel);
    this.delayTimer = setTimeout(() => {
      active.holding = true;
      this.startHold(active);
    }, TAP_MAX_MS);
  }

  stop(): void {
    this.active = null;
    clearTimeout(this.delayTimer);
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointerup', this.onRelease);
    window.removeEventListener('pointercancel', this.onCancel);
    window.removeEventListener('blur', this.onCancel);
  }

  private finish(released: boolean): void {
    const active = this.active;
    this.stop();
    if (released && active && !active.holding) {
      active.target.scrollBy(active.direction * active.target.step(), true);
    }
  }

  private startHold(active: ActivePress): void {
    const { target, direction } = active;
    let last = target.position();
    let previousTime = 0;
    let pending = 0;
    let stuck = 0;
    const tick = (time: number) => {
      if (previousTime) pending += (Math.min(time - previousTime, 50) / 1000) * HOLD_SPEED_PX_PER_SECOND;
      previousTime = time;
      const whole = Math.floor(pending);
      if (whole >= 1) {
        pending -= whole;
        target.scrollBy(direction * whole, false);
        const now = target.position();
        stuck = now === last ? stuck + 1 : 0;
        if (stuck >= STUCK_FRAMES) {
          this.stop();
          return;
        }
        last = now;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}

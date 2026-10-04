import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface ParetoPoint {
  readonly products: number;
  readonly value: number;
}

const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const TICKS = [0, 25, 50, 75, 100];

const CLASS_THRESHOLDS = [
  { value: 80, label: 'A | B (80%)' },
  { value: 95, label: 'B | C (95%)' },
] as const;

@Component({
  selector: 'app-pareto-chart',
  template: `
    <figure class="pareto">
      <svg [attr.viewBox]="viewBox" role="img" [attr.aria-label]="ariaLabel()" (mouseleave)="active.set(null)">
        @for (tick of ticks; track tick) {
          <line class="grid" [attr.x1]="pad.left" [attr.x2]="pad.left + plotW" [attr.y1]="y(tick)" [attr.y2]="y(tick)" />
          <text class="axis" [attr.x]="pad.left - 8" [attr.y]="y(tick) + 4" text-anchor="end">{{ tick }}%</text>
          <text class="axis" [attr.x]="x(tick)" [attr.y]="pad.top + plotH + 20" text-anchor="middle">{{ tick }}%</text>
        }
        @for (threshold of thresholds; track threshold.value) {
          <line class="threshold" [attr.x1]="pad.left" [attr.x2]="pad.left + plotW" [attr.y1]="y(threshold.value)" [attr.y2]="y(threshold.value)" />
          <text class="threshold-label" [attr.x]="pad.left + plotW - 4" [attr.y]="y(threshold.value) - 6" text-anchor="end">
            {{ threshold.label }}
          </text>
        }
        <polyline class="curve" [attr.points]="polyline()" />
        @for (point of points(); track point.products; let i = $index) {
          <circle
            class="hit"
            [attr.cx]="x(point.products)"
            [attr.cy]="y(point.value)"
            r="12"
            (mouseenter)="active.set(i)"
            (focus)="active.set(i)"
            tabindex="0"
          />
          <circle
            class="dot"
            [class.dot--active]="active() === i"
            [attr.cx]="x(point.products)"
            [attr.cy]="y(point.value)"
            r="4"
          />
        }
        @if (activePoint(); as point) {
          <g class="tip" [attr.transform]="'translate(' + tipX(point.products) + ',' + (y(point.value) - 44) + ')'">
            <rect width="150" height="36" rx="6" />
            <text x="10" y="15">{{ point.products }}% de productos</text>
            <text x="10" y="29" class="tip-strong">{{ point.value }}% del valor</text>
          </g>
        }
      </svg>
      <figcaption>Eje X: % acumulado de productos · Eje Y: % acumulado del valor de inventario</figcaption>
    </figure>
  `,
  styles: `
    .pareto { margin: 0; }
    svg { display: block; width: 100%; height: auto; overflow: visible; }
    .grid { stroke: var(--color-border); stroke-width: 1; }
    .axis { fill: var(--color-text-muted); font-size: 11px; }
    .threshold { stroke: var(--color-text-muted); stroke-width: 1; stroke-dasharray: 4 4; }
    .threshold-label { fill: var(--color-text-secondary); font-size: 11px; font-weight: 600; }
    .curve { fill: none; stroke: var(--color-primary); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .dot { fill: var(--color-primary); stroke: var(--color-surface); stroke-width: 2; pointer-events: none; }
    .dot--active { r: 6; }
    .hit { fill: transparent; cursor: pointer; outline: none; }
    .tip rect { fill: var(--color-surface); stroke: var(--color-border); filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.08)); }
    .tip text { fill: var(--color-text-secondary); font-size: 11px; }
    .tip .tip-strong { fill: var(--color-text-primary); font-weight: 700; }
    figcaption { margin-top: 6px; color: var(--color-text-muted); font-size: var(--font-size-xs); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParetoChart {
  readonly points = input.required<readonly ParetoPoint[]>();

  readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  readonly pad = PAD;
  readonly plotW = PLOT_W;
  readonly plotH = PLOT_H;
  readonly ticks = TICKS;
  readonly thresholds = CLASS_THRESHOLDS;
  readonly active = signal<number | null>(null);

  readonly polyline = computed(() => this.points().map((p) => `${this.x(p.products)},${this.y(p.value)}`).join(' '));
  readonly activePoint = computed(() => {
    const index = this.active();
    return index === null ? null : (this.points()[index] ?? null);
  });
  readonly ariaLabel = computed(() => {
    const at80 = this.points().find((p) => p.value >= 80);
    return at80
      ? `Curva de Pareto: el ${at80.products}% de los productos concentra el ${at80.value}% del valor de inventario.`
      : 'Curva de Pareto del valor de inventario.';
  });

  x(percent: number): number {
    return PAD.left + (percent / 100) * PLOT_W;
  }

  y(percent: number): number {
    return PAD.top + PLOT_H - (percent / 100) * PLOT_H;
  }

  tipX(percent: number): number {
    return Math.min(Math.max(this.x(percent) - 75, PAD.left), WIDTH - PAD.right - 150);
  }
}

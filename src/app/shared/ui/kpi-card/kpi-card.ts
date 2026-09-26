import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type KpiTrend = 'up' | 'down' | 'flat';
export type KpiTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * KPI / stat card — Figma "Components Library · Row 3 · KPI CARD".
 * label + value, optional icon, optional delta (`+14.2%`) with comparison caption.
 */
@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>();
  readonly delta = input<string>();
  readonly deltaCaption = input<string>();
  /** Texto descriptivo bajo el valor cuando la tarjeta no muestra variación. */
  readonly caption = input<string>();
  readonly trend = input<KpiTrend>('flat');
  readonly tone = input<KpiTone>('default');

  readonly trendIcon = computed(() =>
    this.trend() === 'up' ? 'trending_up' : this.trend() === 'down' ? 'trending_down' : 'trending_flat',
  );
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { STATUS_HINT } from './status-hints';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_BY_STATUS: Readonly<Record<string, StatusTone>> = {
  ACTIVE: 'success', ACTIVA: 'success', ACTIVO: 'success', AVAILABLE: 'success', SUCCESS: 'success',
  COMPLETADA: 'success', COMPLETADO: 'success', ENTREGADO: 'success', REGISTRADO: 'success', RECIBIDO: 'success', NORMAL: 'success',
  PENDING: 'warning', PENDIENTE: 'warning', EXPIRING: 'warning', 'POR VENCER': 'warning', LOW_STOCK: 'warning', BAJO: 'warning',
  WARNING: 'warning', MODERADO: 'warning', PARCIAL: 'warning',
  INACTIVE: 'neutral', INACTIVA: 'neutral', INACTIVO: 'neutral', SUSPENDED: 'neutral', SUSPENDIDA: 'neutral', BORRADOR: 'neutral',
  EXPIRED: 'danger', VENCIDA: 'danger', OUT_OF_STOCK: 'danger', ERROR: 'danger', ANULADO: 'danger', ANULADA: 'danger',
  CRITICO: 'danger', 'CRÍTICO': 'danger', FALLIDO: 'danger', RECHAZADO: 'danger', LOCKED: 'danger',
  'PEDIR YA': 'danger', 'PEDIR PRONTO': 'warning', 'AL DÍA': 'success',
  FALTANTE: 'danger', REVISAR: 'warning', 'SIN VOLVER': 'warning', 'SIN SALIDA': 'warning', SOBRANTE: 'warning', 'CIERRE FORZADO': 'warning', 'ABIERTA MUCHO TIEMPO': 'warning',
};

const LABEL_BY_STATUS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', AVAILABLE: 'Disponible', LOW_STOCK: 'Stock bajo',
  OUT_OF_STOCK: 'Sin stock', PENDING: 'Pendiente', EXPIRED: 'Vencido', SUSPENDED: 'Suspendido',
  SUCCESS: 'Correcto', WARNING: 'Advertencia', ERROR: 'Error', NORMAL: 'Normal', LOCKED: 'Bloqueado',
};

@Component({
  selector: 'app-status-chip',
  imports: [MatTooltip],
  template: `<span
    [class]="'chip chip--' + tone()"
    [class.chip--hint]="!!tooltip()"
    [attr.tabindex]="tooltip() ? 0 : null"
    [matTooltip]="tooltip() ?? ''"
    [matTooltipDisabled]="!tooltip()"
    matTooltipClass="status-chip-tooltip"
    matTooltipPosition="above"
  >{{ displayLabel() }}</span>`,
  styleUrl: './status-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChip {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string | null | undefined>();
  private readonly normalized = computed(() => this.value().toUpperCase());
  readonly tone = computed<StatusTone>(() => TONE_BY_STATUS[this.normalized()] ?? 'info');
  readonly displayLabel = computed(() =>
    this.label() === this.value() ? (LABEL_BY_STATUS[this.normalized()] ?? this.label()) : this.label(),
  );
  readonly tooltip = computed(() => this.hint() || STATUS_HINT[this.normalized()] || null);
}

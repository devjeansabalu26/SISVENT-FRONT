import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_BY_STATUS: Readonly<Record<string, StatusTone>> = {
  ACTIVE: 'success', ACTIVA: 'success', ACTIVO: 'success', AVAILABLE: 'success', SUCCESS: 'success',
  COMPLETADA: 'success', COMPLETADO: 'success', ENTREGADO: 'success', REGISTRADO: 'success', RECIBIDO: 'success', NORMAL: 'success',
  PENDING: 'warning', PENDIENTE: 'warning', EXPIRING: 'warning', 'POR VENCER': 'warning', LOW_STOCK: 'warning', BAJO: 'warning',
  WARNING: 'warning', MODERADO: 'warning', PARCIAL: 'warning',
  INACTIVE: 'neutral', INACTIVA: 'neutral', INACTIVO: 'neutral', SUSPENDED: 'neutral', SUSPENDIDA: 'neutral', BORRADOR: 'neutral',
  EXPIRED: 'danger', VENCIDA: 'danger', OUT_OF_STOCK: 'danger', ERROR: 'danger', ANULADO: 'danger', ANULADA: 'danger',
  CRITICO: 'danger', 'CRÍTICO': 'danger', FALLIDO: 'danger', RECHAZADO: 'danger',
};

const LABEL_BY_STATUS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', AVAILABLE: 'Disponible', LOW_STOCK: 'Stock bajo',
  OUT_OF_STOCK: 'Sin stock', PENDING: 'Pendiente', EXPIRED: 'Vencido', SUSPENDED: 'Suspendido',
  SUCCESS: 'Correcto', WARNING: 'Advertencia', ERROR: 'Error', NORMAL: 'Normal',
};

@Component({
  selector: 'app-status-chip',
  template: '<span class="chip" [class]="\'chip chip--\' + tone()">{{ displayLabel() }}</span>',
  styleUrl: './status-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChip {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  private readonly normalized = computed(() => this.value().toUpperCase());
  readonly tone = computed<StatusTone>(() => TONE_BY_STATUS[this.normalized()] ?? 'info');
  readonly displayLabel = computed(() =>
    this.label() === this.value() ? (LABEL_BY_STATUS[this.normalized()] ?? this.label()) : this.label(),
  );
}

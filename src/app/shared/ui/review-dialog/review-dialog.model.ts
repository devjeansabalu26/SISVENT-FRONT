import { DiffRow } from '../../utils/diff-rows';

export type ReviewTone = 'info' | 'warning' | 'danger' | 'success';

/** Par etiqueta/valor ("Empresa: Comercial Andina S.A.C."). */
export interface ReviewMeta {
  readonly label: string;
  readonly value: string;
}

/** Tarjeta "ANTES → DESPUÉS" con chips de estado (Figma MOD-SA-02, MOD-SA-10, MOD-AD-05). */
export interface ReviewTransition {
  readonly fromLabel: string;
  readonly from: string;
  readonly toLabel: string;
  readonly to: string;
}

/** Métrica destacada ("Productos · 3 items"). */
export interface ReviewKpi {
  readonly label: string;
  readonly value: string;
}

/** Grupo de chips ("MÓDULOS ACTIVADOS: Reportes, Auditoría"). `empty` se muestra si no hay elementos. */
export interface ReviewChipGroup {
  readonly label: string;
  readonly items: readonly string[];
  readonly empty?: string;
  readonly tone?: ReviewTone;
}

/**
 * Datos del diálogo genérico de revisión / confirmación de los catálogos de modales de Figma.
 * Cada sección es opcional y se pinta en este orden: intro → meta → transición → KPIs → tabla de
 * diferencias → chips → banner → nota.
 */
export interface ReviewDialogData {
  readonly title: string;
  /** Código del catálogo Figma (p. ej. `MOD-SA-08`), se muestra a la derecha del título. */
  readonly code?: string;
  /** Nombre de Material Icon. */
  readonly icon: string;
  readonly intro?: string;
  readonly meta?: readonly ReviewMeta[];
  readonly transition?: ReviewTransition;
  readonly kpis?: readonly ReviewKpi[];
  readonly diff?: {
    readonly headers?: readonly [string, string, string];
    readonly rows: readonly DiffRow[];
  };
  readonly chipGroups?: readonly ReviewChipGroup[];
  readonly banner?: { readonly tone: ReviewTone; readonly text: string };
  readonly note?: string;
  /**
   * Campo de motivo. Si se define, el diálogo se cierra con el texto (recortado) en lugar de `true`.
   * `minLength` por defecto: 5 (la regla del backend para motivos de suspensión, cambio de plan, etc.).
   */
  readonly reason?: {
    readonly label: string;
    readonly placeholder?: string;
    readonly minLength?: number;
  };
  readonly confirmLabel: string;
  /** `null` oculta el botón de cancelar (diálogos solo informativos). */
  readonly cancelLabel?: string | null;
  readonly destructive?: boolean;
}

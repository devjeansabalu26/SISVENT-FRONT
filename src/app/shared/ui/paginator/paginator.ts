import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type PageToken = { readonly kind: 'page'; readonly value: number } | { readonly kind: 'gap' };

/**
 * Footer de paginación reutilizable: "Mostrando 1-10 de 124 registros   < 1 2 3 … 13 >".
 * El paginado es real: emite `pageChange` y la página contenedora vuelve a pedir datos al backend.
 */
@Component({
  selector: 'app-paginator',
  imports: [DecimalPipe],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  /** Página actual (base 1). */
  readonly pageNumber = input.required<number>();
  readonly pageSize = input.required<number>();
  /** Total de registros que cumplen los filtros activos (no solo la página visible). */
  readonly total = input.required<number>();
  /** Sustantivo para la leyenda: "registros", "usuarios", "empresas"… */
  readonly itemNoun = input('registros');
  readonly disabled = input(false);

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.total() / size)) : 1;
  });

  readonly from = computed(() => (this.total() === 0 ? 0 : (this.pageNumber() - 1) * this.pageSize() + 1));
  readonly to = computed(() => Math.min(this.pageNumber() * this.pageSize(), this.total()));

  readonly tokens = computed<readonly PageToken[]>(() => {
    const total = this.totalPages();
    const current = this.pageNumber();
    const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
    const shown = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out: PageToken[] = [];
    let previous = 0;
    for (const n of shown) {
      if (n - previous > 1) out.push({ kind: 'gap' });
      out.push({ kind: 'page', value: n });
      previous = n;
    }
    return out;
  });

  go(page: number): void {
    const target = Math.min(Math.max(1, page), this.totalPages());
    if (!this.disabled() && target !== this.pageNumber()) this.pageChange.emit(target);
  }
}

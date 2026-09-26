import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { LoadState, ReplenishmentLoadState, loadStateFor } from '../components/load-state/load-state';
import { ParetoChart, ParetoPoint } from '../components/pareto-chart/pareto-chart';
import { ReplenishmentApiService } from '../data-access/replenishment-api.service';
import { AbcAnalysis, AbcClassCode, AbcItem } from '../models/replenishment.model';
import { formatQuantity, formatSoles } from '../utils/replenishment-format';

const CLASS_TEXT: Readonly<Record<AbcClassCode, { readonly label: string; readonly description: string }>> = {
  A: { label: 'Alta contribución', description: 'Concentran hasta el 80% de los ingresos: nunca deben agotarse.' },
  B: { label: 'Contribución media', description: 'Siguiente 15% de los ingresos: reposición regular.' },
  C: { label: 'Baja contribución', description: 'Último 5% o sin ventas: revisar surtido y compras.' },
};

/** Curva de Pareto: % acumulado de productos (en orden de ingresos) vs. % acumulado de ingresos. */
export function paretoPoints(items: readonly AbcItem[]): readonly ParetoPoint[] {
  if (!items.length) return [];
  return [
    { products: 0, value: 0 },
    ...items.map((item, index) => ({
      products: Math.round(((index + 1) / items.length) * 1000) / 10,
      value: item.cumulativeShare,
    })),
  ];
}

@Component({
  selector: 'app-abc-rotation-page',
  imports: [DataTable, PageHeader, ParetoChart, ReplenishmentLoadState],
  templateUrl: './abc-rotation-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbcRotationPage implements OnInit {
  private readonly api = inject(ReplenishmentApiService);

  readonly state = signal<LoadState>('loading');
  readonly data = signal<AbcAnalysis | null>(null);
  readonly formatSoles = formatSoles;

  readonly totalItems = computed(() => this.data()?.items.length ?? 0);
  readonly classes = computed(() =>
    (this.data()?.classes ?? []).map((klass) => ({ ...klass, ...CLASS_TEXT[klass.class] })),
  );
  readonly paretoCurve = computed(() => paretoPoints(this.data()?.items ?? []));
  readonly rows = computed(() => (this.data()?.items ?? []).map((item) => ({ ...item, id: item.productId })));

  readonly columns: readonly DataTableColumn<AbcItem & { readonly id: string }>[] = [
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'class', label: 'Clase ABC', value: (row) => `Clase ${row.class}` },
    { key: 'quantity', label: 'Unidades vendidas', value: (row) => formatQuantity(row.quantity) },
    { key: 'rotation', label: 'Rotación', value: (row) => row.rotation },
    { key: 'margin', label: 'Margen %', value: (row) => (row.marginPercent === null ? '—' : `${row.marginPercent}%`) },
    { key: 'revenue', label: 'Ingresos', value: (row) => formatSoles(row.revenue) },
    { key: 'share', label: '% acumulado', value: (row) => `${row.cumulativeShare}%` },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.api.abc().subscribe({
      next: (data) => {
        this.data.set(data);
        this.state.set('ready');
      },
      error: (cause: unknown) => this.state.set(loadStateFor(cause)),
    });
  }

  itemShare(items: number): number {
    const total = this.totalItems();
    return total ? Math.round((items / total) * 100) : 0;
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { LoadState, ReplenishmentLoadState, loadStateFor } from '../components/load-state/load-state';
import { ReplenishmentApiService } from '../data-access/replenishment-api.service';
import { StagnantAnalysis, StagnantItem } from '../models/replenishment.model';
import { formatQuantity, formatSoles } from '../utils/replenishment-format';

const THRESHOLDS = [30, 60, 90, 120] as const;

const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

@Component({
  selector: 'app-stagnant-stock-page',
  imports: [DataTable, PageHeader, KpiCard, ReplenishmentLoadState],
  templateUrl: './stagnant-stock-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagnantStockPage implements OnInit {
  private readonly api = inject(ReplenishmentApiService);

  readonly state = signal<LoadState>('loading');
  readonly data = signal<StagnantAnalysis | null>(null);
  readonly threshold = signal<number>(60);
  readonly thresholds = THRESHOLDS;
  readonly formatSoles = formatSoles;

  readonly rows = computed(() => (this.data()?.items ?? []).map((item) => ({ ...item, id: item.productId })));

  readonly columns: readonly DataTableColumn<StagnantItem & { readonly id: string }>[] = [
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'stock', label: 'Stock', value: (row) => formatQuantity(row.stock) },
    { key: 'daysWithoutSale', label: 'Días sin vta', value: (row) => (row.daysWithoutSale === null ? 'Nunca vendido' : `${row.daysWithoutSale} d`) },
    { key: 'value', label: 'Valor', value: (row) => formatSoles(row.value) },
    { key: 'lastMovement', label: 'Último mov.', value: (row) => formatDate(row.lastMovementAt) },
    { key: 'cause', label: 'Causa', value: (row) => row.cause },
    { key: 'suggestedAction', label: 'Acción sugerida', value: (row) => row.suggestedAction, type: 'status' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.api.stagnant(this.threshold()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.state.set('ready');
      },
      error: (cause: unknown) => this.state.set(loadStateFor(cause)),
    });
  }

  changeThreshold(value: string): void {
    this.threshold.set(Number(value));
    this.load();
  }
}

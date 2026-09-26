import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { LoadState, ReplenishmentLoadState, loadStateFor } from '../components/load-state/load-state';
import {
  RecommendationExplainData,
  RecommendationExplainDialog,
} from '../components/recommendation-explain-dialog/recommendation-explain-dialog';
import { ReplenishmentApiService } from '../data-access/replenishment-api.service';
import { PRIORITY_LABELS, RISK_LABELS, ReplenishmentSummary, StockRiskItem } from '../models/replenishment.model';
import { formatQuantity, purchaseOrderCsv } from '../utils/replenishment-format';

/** Método mostrado en el modal MOD-PR-03. */
const RECOMMENDATION_METHOD = 'SISVENT Smart Stock (ventas de los últimos 30 días)';

@Component({
  selector: 'app-replenishment-summary-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink, ReplenishmentLoadState],
  templateUrl: './replenishment-summary-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplenishmentSummaryPage implements OnInit {
  private readonly api = inject(ReplenishmentApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly state = signal<LoadState>('loading');
  readonly data = signal<ReplenishmentSummary | null>(null);
  readonly priorityLabels = PRIORITY_LABELS;
  readonly formatQuantity = formatQuantity;

  readonly coverage = computed(() => {
    const coverage = this.data()?.coverage;
    if (!coverage) return [];
    return [
      { label: 'Suficiente (> 15 días)', count: coverage.sufficient, tone: 'success' },
      { label: 'Moderado (7 – 15 días)', count: coverage.moderate, tone: 'warning' },
      { label: 'Crítico (< 7 días o bajo el mínimo)', count: coverage.critical, tone: 'danger' },
      { label: 'Sin ventas en 30 días', count: coverage.noSales, tone: 'neutral' },
    ];
  });

  /** Críticos con menos de 3 días de cobertura (o agotados): el banner de "Atención requerida". */
  readonly urgent = computed(() => this.data()?.critical.filter((item) => item.priority === 'CRITICA').length ?? 0);

  readonly columns: readonly DataTableColumn<StockRiskItem & { readonly id: string }>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock actual', value: (row) => `${formatQuantity(row.currentStock)} uds (mín. ${formatQuantity(row.minStock)})` },
    { key: 'avgSales', label: 'Ventas promedio', value: (row) => `${formatQuantity(row.averageDailySales)} uds/día` },
    { key: 'coverageDays', label: 'Cobertura', value: (row) => (row.coverageDays === null ? 'Sin ventas' : `${row.coverageDays} días`) },
    { key: 'risk', label: 'Riesgo', value: (row) => RISK_LABELS[row.risk], type: 'status' },
  ];

  readonly criticalRows = computed(() => (this.data()?.critical ?? []).map((item) => ({ ...item, id: item.productId })));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.api.summary().subscribe({
      next: (data) => {
        this.data.set(data);
        this.state.set('ready');
      },
      error: (cause: unknown) => this.state.set(loadStateFor(cause)),
    });
  }

  /** MOD-PR-03: desglose de la fórmula detrás de una compra sugerida, con los datos reales del producto. */
  explain(item: StockRiskItem): void {
    this.dialog.open<RecommendationExplainDialog, RecommendationExplainData, void>(RecommendationExplainDialog, {
      data: {
        product: item.name,
        method: RECOMMENDATION_METHOD,
        input: {
          currentStock: item.currentStock,
          averageDailySales: item.averageDailySales,
          leadTimeDays: item.leadTimeDays,
          safetyStock: item.safetyStock,
        },
      },
    });
  }

  /** "Procesar todo": descarga la orden de compra sugerida agrupada por proveedor. */
  processAll(): void {
    const suggestions = this.data()?.suggestions ?? [];
    if (!suggestions.length) {
      this.notifications.show('No hay compras sugeridas por procesar.', 'info');
      return;
    }
    const blob = new Blob([purchaseOrderCsv(suggestions)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orden-compra-sugerida-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.notifications.show(`Orden de compra sugerida descargada (${suggestions.length} productos).`, 'success');
  }
}

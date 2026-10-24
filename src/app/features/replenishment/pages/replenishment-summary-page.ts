import { ExcelExportService, excelTable } from '../../../shared/export/excel-export.service';
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
import { formatQuantity } from '../utils/replenishment-format';
import { riskHint } from '../utils/status-hints';

const RECOMMENDATION_METHOD = 'SAVIX Smart Stock (ventas de los últimos 30 días)';

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
  private readonly excel = inject(ExcelExportService);
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

  readonly urgent = computed(() => this.data()?.critical.filter((item) => item.priority === 'CRITICA').length ?? 0);

  readonly columns: readonly DataTableColumn<StockRiskItem & { readonly id: string }>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock actual', value: (row) => `${formatQuantity(row.currentStock)} uds (mín. ${formatQuantity(row.minStock)})` },
    { key: 'avgSales', label: 'Ventas promedio', value: (row) => `${formatQuantity(row.averageDailySales)} uds/día` },
    { key: 'coverageDays', label: 'Cobertura', value: (row) => (row.coverageDays === null ? 'Sin ventas' : `${row.coverageDays} días`) },
    { key: 'risk', label: 'Riesgo', value: (row) => RISK_LABELS[row.risk], type: 'status', hint: riskHint },
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

  async processAll(): Promise<void> {
    const suggestions = [...(this.data()?.suggestions ?? [])]
      .filter((item) => item.suggestedQuantity > 0)
      .sort((a, b) => (a.supplierName ?? '').localeCompare(b.supplierName ?? '', 'es') || a.name.localeCompare(b.name, 'es'));
    if (!suggestions.length) {
      this.notifications.show('No hay compras sugeridas por procesar.', 'info');
      return;
    }
    await this.excel.export({
      fileName: 'orden-compra-sugerida',
      title: 'Orden de compra sugerida',
      subtitle: `Reabastecimiento · ${suggestions.length} productos`,
      sheets: [
        excelTable({ name: 'Compras sugeridas', rows: suggestions, totals: true, columns: [
          { header: 'Proveedor', value: (item) => item.supplierName ?? 'Sin proveedor asignado' },
          { header: 'SKU', value: (item) => item.sku },
          { header: 'Producto', value: (item) => item.name },
          { header: 'Cantidad sugerida', value: (item) => item.suggestedQuantity, type: 'number' },
          { header: 'Costo referencial', value: (item) => item.referenceCost ?? null, type: 'money', total: false },
          { header: 'Subtotal estimado', value: (item) => (item.referenceCost != null ? item.suggestedQuantity * item.referenceCost : null), type: 'money' },
          { header: 'Stock actual', value: (item) => item.currentStock, type: 'number', total: false },
          { header: 'Stock mínimo', value: (item) => item.minStock, type: 'number', total: false },
          { header: 'Venta diaria', value: (item) => item.averageDailySales, type: 'number', total: false },
          { header: 'Reposición (días)', value: (item) => item.leadTimeDays, type: 'integer', total: false },
        ] }),
      ],
    });
    this.notifications.show(`Orden de compra sugerida descargada (${suggestions.length} productos).`, 'success');
  }
}

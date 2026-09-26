import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import {
  RecommendationExplainData,
  RecommendationExplainDialog,
} from '../components/recommendation-explain-dialog/recommendation-explain-dialog';
import { RECOMMENDATION_INPUT_MOCK, RECOMMENDATION_METHOD } from '../data-access/recommendation-input.mock';
import { CRITICAL_PRODUCT_MOCK, PURCHASE_SUGGESTION_MOCK } from '../data-access/replenishment.mock';
import { CriticalProduct, PurchaseSuggestion } from '../models/replenishment.model';

@Component({
  selector: 'app-replenishment-summary-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './replenishment-summary-page.html',
  styleUrls: ['../../../shared/ui/list-page.scss', './replenishment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplenishmentSummaryPage {
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly recommendationInputs = RECOMMENDATION_INPUT_MOCK;

  readonly suggestions = PURCHASE_SUGGESTION_MOCK;
  readonly criticalRows = CRITICAL_PRODUCT_MOCK;

  readonly coverage: readonly { readonly label: string; readonly count: number; readonly tone: string }[] = [
    { label: 'Suficiente (> 15 días)', count: 205, tone: 'success' },
    { label: 'Moderado (7 – 15 días)', count: 51, tone: 'warning' },
    { label: 'Crítico (< 7 días)', count: 28, tone: 'danger' },
  ];

  readonly columns: readonly DataTableColumn<CriticalProduct>[] = [
    { key: 'sku', label: 'SKU', value: (row) => row.sku },
    { key: 'name', label: 'Producto', value: (row) => row.name },
    { key: 'stock', label: 'Stock actual', value: (row) => `${row.stock} uds` },
    { key: 'avgSales', label: 'Ventas promedio', value: (row) => row.avgSales },
    { key: 'coverageDays', label: 'Cobertura', value: (row) => `${row.coverageDays} días` },
    { key: 'risk', label: 'Riesgo', value: (row) => row.risk, type: 'status' },
  ];

  /** MOD-PR-03: desglose de la fórmula detrás de una compra sugerida. */
  explain(item: PurchaseSuggestion): void {
    const input = this.recommendationInputs[item.id];
    if (!input) return;
    this.dialog.open<RecommendationExplainDialog, RecommendationExplainData, void>(RecommendationExplainDialog, {
      data: { product: item.product, method: RECOMMENDATION_METHOD, input },
    });
  }

  processAll(): void {
    this.notifications.show('Se generaron las órdenes de compra sugeridas.', 'success');
  }
}

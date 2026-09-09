import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { GOODS_RECEIPT_MOCK } from '../data-access/goods-receipt.mock';
import { GoodsReceiptListItem } from '../models/goods-receipt.model';

@Component({
  selector: 'app-goods-receipt-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './goods-receipt-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptListPage {
  private readonly router = inject(Router);
  readonly search = signal('');
  readonly statusFilter = signal('');
  private readonly receipts = signal<readonly GoodsReceiptListItem[]>(GOODS_RECEIPT_MOCK);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.receipts().filter((item) => {
      const matchesTerm = !term || `${item.code} ${item.supplier}`.toLowerCase().includes(term);
      return matchesTerm && (!status || item.status === status);
    });
  });

  readonly monthCount = computed(() => this.receipts().length);
  readonly totalUnits = computed(() => this.receipts().reduce((total, item) => total + item.itemCount, 0));
  readonly totalValue = computed(() => this.receipts().reduce((total, item) => total + item.totalValue, 0));
  readonly pending = computed(() => this.receipts().filter((item) => item.status === 'Pendiente').length);

  readonly columns: readonly DataTableColumn<GoodsReceiptListItem>[] = [
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'date', label: 'Fecha', value: (row) => row.date },
    { key: 'supplier', label: 'Proveedor', value: (row) => row.supplier },
    { key: 'itemCount', label: 'Items', value: (row) => `${row.itemCount} items` },
    { key: 'totalValue', label: 'Valor total', value: (row) => `S/ ${row.totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
    { key: 'receivedBy', label: 'Recibido por', value: (row) => row.receivedBy },
    { key: 'notes', label: 'Observaciones', value: (row) => row.notes },
  ];

  open(receipt: GoodsReceiptListItem): void {
    void this.router.navigate(['/app/goods-receipts', receipt.id]);
  }
}

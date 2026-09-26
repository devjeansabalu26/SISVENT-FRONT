import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { GoodsReceiptApiService } from '../data-access/goods-receipt-api.service';
import { GoodsReceiptListItem, GoodsReceiptSummary } from '../models/goods-receipt.model';

@Component({
  selector: 'app-goods-receipt-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './goods-receipt-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptListPage implements OnInit {
  private readonly api = inject(GoodsReceiptApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly summary = signal<GoodsReceiptSummary | null>(null);
  private readonly receipts = signal<readonly GoodsReceiptListItem[]>([]);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.receipts().filter((item) => {
      const matchesTerm = !term || `${item.receiptNumber} ${item.supplierName ?? ''}`.toLowerCase().includes(term);
      return matchesTerm && (!status || item.status === status);
    });
  });

  readonly columns: readonly DataTableColumn<GoodsReceiptListItem>[] = [
    { key: 'receiptNumber', label: 'Código', value: (row) => row.receiptNumber },
    { key: 'receiptDate', label: 'Fecha', value: (row) => new Date(row.receiptDate).toLocaleDateString('es-PE') },
    { key: 'supplierName', label: 'Proveedor', value: (row) => row.supplierName ?? '—' },
    { key: 'itemCount', label: 'Items', value: (row) => `${row.itemCount} items` },
    { key: 'totalCost', label: 'Valor total', value: (row) => `S/ ${row.totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
    { key: 'receivedBy', label: 'Recibido por', value: (row) => row.receivedBy },
  ];

  ngOnInit(): void {
    this.api.summary().subscribe((summary) => this.summary.set(summary));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.receipts.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(receipt: GoodsReceiptListItem): void {
    void this.router.navigate(['/app/goods-receipts', receipt.id]);
  }
}

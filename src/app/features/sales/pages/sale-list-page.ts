import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CashCloseDialog } from '../components/cash-close-dialog/cash-close-dialog';
import { SaleApiService } from '../data-access/sale-api.service';
import { Sale, SalesTotals } from '../models/sale.model';

@Component({
  selector: 'app-sale-list-page',
  imports: [DataTable, PageHeader, FormsModule],
  templateUrl: './sale-list-page.html',
  styleUrl: './sale-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleListPage implements OnInit {
  private readonly api = inject(SaleApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly isAdmin = inject(UserContextService).user()?.role === 'ADMIN';

  readonly loading = signal(false);
  readonly rows = signal<readonly Sale[]>([]);
  readonly totals = signal<SalesTotals>({ operationCount: 0, totalAmount: 0 });

  // Filtros (Figma `admin-historial-ventas` / `vendedor-mis-ventas`): se aplican al presionar "Filtrar".
  // El backend ya limita al VENDEDOR a sus propias ventas, por eso no hay selector "Ventas del local".
  search = '';
  from = '';
  to = '';
  paymentMethod = '';
  status = '';
  readonly paymentOptions = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'YAPE', label: 'Yape' },
    { value: 'PLIN', label: 'Plin' },
    { value: 'TRANSFER', label: 'Transferencia' },
  ] as const;

  readonly columns: readonly DataTableColumn<Sale>[] = [
    { key: 'number', label: 'Nro venta', value: (row) => row.saleNumber },
    { key: 'date', label: 'Fecha', value: (row) => new Date(row.saleDate).toLocaleString('es-PE') },
    { key: 'customer', label: 'Cliente', value: (row) => row.clientName ?? 'Cliente general' },
    { key: 'seller', label: 'Vendedor', value: (row) => row.sellerName },
    { key: 'branch', label: 'Local', value: (row) => row.storeName },
    { key: 'payment', label: 'Método pago', value: (row) => row.paymentMethod },
    { key: 'total', label: 'Total', value: (row) => `S/ ${row.total.toFixed(2)}` },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({
        pageSize: 100,
        search: this.search.trim() || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
        paymentMethod: this.paymentMethod || undefined,
        status: this.status || undefined,
      })
      .subscribe({
      next: (page) => {
        this.rows.set(page.items);
        this.totals.set(page.periodTotals);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearFilters(): void {
    this.search = '';
    this.from = '';
    this.to = '';
    this.paymentMethod = '';
    this.status = '';
    this.load();
  }

  closeCash(): void {
    this.dialog
      .open(CashCloseDialog)
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Resumen de caja generado.', 'success'));
  }

  open(sale: Sale): void {
    void this.router.navigate(['/app/sales', sale.id]);
  }

  receipt(sale: Sale): void {
    void this.router.navigate(['/app/sales', sale.id, 'comprobante']);
  }
}

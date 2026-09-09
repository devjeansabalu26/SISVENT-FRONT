import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CashCloseDialog } from '../components/cash-close-dialog/cash-close-dialog';
import { SALE_MOCK } from '../data-access/sale.mock';
import { SaleListItem } from '../models/sale.model';

@Component({
  selector: 'app-sale-list-page',
  imports: [DataTable, PageHeader],
  templateUrl: './sale-list-page.html',
  styleUrl: './sale-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleListPage {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  readonly isAdmin = inject(UserContextService).user()?.role === 'ADMIN';
  readonly rows = signal(SALE_MOCK);
  readonly total = computed(() => this.rows().reduce((sum, sale) => sum + sale.total, 0));

  closeCash(): void {
    this.dialog
      .open(CashCloseDialog)
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Cierre de caja registrado.', 'success'));
  }

  readonly columns: readonly DataTableColumn<SaleListItem>[] = [
    { key: 'number', label: 'Nro venta', value: (row) => row.number },
    { key: 'date', label: 'Fecha', value: (row) => row.date },
    { key: 'customer', label: 'Cliente', value: (row) => row.customer },
    { key: 'seller', label: 'Vendedor', value: (row) => row.seller },
    { key: 'branch', label: 'Local', value: (row) => row.branch },
    { key: 'payment', label: 'Método pago', value: (row) => row.payment },
    { key: 'total', label: 'Total', value: (row) => `S/ ${row.total.toFixed(2)}` },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  open(sale: SaleListItem): void {
    void this.router.navigate(['/app/sales', sale.id]);
  }

  receipt(sale: SaleListItem): void {
    void this.router.navigate(['/app/sales', sale.id, 'comprobante']);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SUPPLIER_MOCK } from '../data-access/supplier.mock';
import { SupplierListItem } from '../models/supplier.model';

@Component({
  selector: 'app-supplier-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './supplier-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierListPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);

  readonly search = signal('');
  readonly sectorFilter = signal('');
  readonly statusFilter = signal('');
  private readonly suppliers = signal<readonly SupplierListItem[]>(SUPPLIER_MOCK);

  readonly canManage = computed(() => this.userContext.user()?.role === 'ADMIN');

  readonly sectors = computed(() => [...new Set(this.suppliers().map((item) => item.sector))].sort());

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const sector = this.sectorFilter();
    const status = this.statusFilter();
    return this.suppliers().filter((item) => {
      const matchesTerm =
        !term || `${item.taxId} ${item.legalName} ${item.commercialName} ${item.sector}`.toLowerCase().includes(term);
      return matchesTerm && (!sector || item.sector === sector) && (!status || item.status === status);
    });
  });

  readonly totalSuppliers = computed(() => this.suppliers().length);
  readonly activeSuppliers = computed(() => this.suppliers().filter((item) => item.status === 'ACTIVE').length);
  readonly monthPurchases = computed(() =>
    this.suppliers().reduce((total, item) => total + item.totalPurchases, 0),
  );

  readonly columns: readonly DataTableColumn<SupplierListItem>[] = [
    { key: 'taxId', label: 'RUC', value: (row) => row.taxId },
    { key: 'legalName', label: 'Razón social', value: (row) => row.legalName },
    { key: 'commercialName', label: 'N. comercial', value: (row) => row.commercialName },
    { key: 'sector', label: 'Rubro', value: (row) => row.sector },
    { key: 'contactName', label: 'Contacto', value: (row) => row.contactName },
    { key: 'phone', label: 'Teléfono', value: (row) => row.phone },
    { key: 'totalPurchases', label: 'Compras total', value: (row) => `S/ ${row.totalPurchases.toLocaleString('es-PE')}` },
    { key: 'lastPurchase', label: 'Última compra', value: (row) => row.lastPurchase },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  edit(supplier: SupplierListItem): void {
    void this.router.navigate(['/app/suppliers', supplier.id, 'edit']);
  }

  remove(supplier: SupplierListItem): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Deshabilitar proveedor',
          message: `"${supplier.legalName}" dejará de estar disponible para nuevos ingresos de mercadería.`,
          confirmLabel: 'Deshabilitar',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.suppliers.update((rows) =>
          rows.map((row) => (row.id === supplier.id ? { ...row, status: 'INACTIVE' as const } : row)),
        );
        this.notifications.show('Proveedor deshabilitado.', 'success');
      });
  }
}

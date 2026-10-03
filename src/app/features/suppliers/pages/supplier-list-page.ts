import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SupplierApiService } from '../data-access/supplier-api.service';
import { Supplier } from '../models/supplier.model';

@Component({
  selector: 'app-supplier-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './supplier-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierListPage implements OnInit {
  private readonly api = inject(SupplierApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal('');
  private readonly suppliers = signal<readonly Supplier[]>([]);

  readonly canManage = computed(() => this.access.canAccess({ permissions: [APP_PERMISSIONS.suppliersManage] }));
  private readonly access = inject(AccessControlService);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.suppliers().filter((item) => {
      const matchesTerm =
        !term || `${item.taxDocument ?? ''} ${item.businessName} ${item.contactName ?? ''}`.toLowerCase().includes(term);
      const matchesStatus = !status || (status === 'ACTIVE' ? item.isActive : !item.isActive);
      return matchesTerm && matchesStatus;
    });
  });

  readonly totalSuppliers = computed(() => this.suppliers().length);
  readonly activeSuppliers = computed(() => this.suppliers().filter((item) => item.isActive).length);

  readonly columns: readonly DataTableColumn<Supplier>[] = [
    { key: 'taxDocument', label: 'RUC / Documento', value: (row) => row.taxDocument ?? '—' },
    { key: 'businessName', label: 'Razón social', value: (row) => row.businessName },
    { key: 'contactName', label: 'Contacto', value: (row) => row.contactName ?? '—' },
    { key: 'phone', label: 'Teléfono', value: (row) => row.phone ?? '—' },
    { key: 'email', label: 'Correo', value: (row) => row.email ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.suppliers.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  edit(supplier: Supplier): void {
    void this.router.navigate(['/app/suppliers', supplier.id, 'edit']);
  }

  remove(supplier: Supplier): void {
    if (!supplier.isActive) {
      this.notifications.show('El proveedor ya está inactivo.', 'info');
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Deshabilitar proveedor',
          message: `"${supplier.businessName}" dejará de estar disponible para nuevos ingresos de mercadería.`,
          confirmLabel: 'Deshabilitar',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.deactivate(supplier.id, supplier.version).subscribe({
          next: () => {
            this.notifications.show('Proveedor deshabilitado.', 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(
              cause instanceof AppHttpError && cause.status === 409
                ? 'Conflicto: el registro cambió. Se recargó la lista.'
                : 'No se pudo deshabilitar el proveedor.',
              'error',
            );
            this.load();
          },
        });
      });
  }
}

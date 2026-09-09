import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CUSTOMER_MOCK } from '../data-access/customer.mock';
import { CustomerListItem } from '../models/customer.model';

@Component({
  selector: 'app-customer-list-page',
  imports: [DataTable, PageHeader],
  templateUrl: './customer-list-page.html',
  styleUrl: './customer-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListPage {
  private readonly router = inject(Router);
  readonly search = signal('');
  private readonly customers = signal(CUSTOMER_MOCK);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.customers();
    return this.customers().filter((customer) =>
      `${customer.name} ${customer.document} ${customer.email}`.toLowerCase().includes(term),
    );
  });

  readonly columns: readonly DataTableColumn<CustomerListItem>[] = [
    { key: 'type', label: 'Tipo', value: (row) => (row.type === 'PERSON' ? 'Persona' : 'Empresa') },
    { key: 'name', label: 'Nombre / Razón social', value: (row) => row.name },
    { key: 'document', label: 'Documento', value: (row) => row.document },
    { key: 'email', label: 'Correo', value: (row) => row.email },
    { key: 'phone', label: 'Teléfono', value: (row) => row.phone },
    { key: 'purchases', label: 'Compras total', value: (row) => `S/ ${row.purchases.toFixed(2)}` },
    { key: 'last', label: 'Última compra', value: (row) => row.lastPurchase },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  open(customer: CustomerListItem): void {
    void this.router.navigate(['/app/customers', customer.id]);
  }

  edit(customer: CustomerListItem): void {
    void this.router.navigate(['/app/customers', customer.id, 'edit']);
  }
}

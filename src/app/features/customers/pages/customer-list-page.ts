import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CustomerApiService } from '../data-access/customer-api.service';
import { Customer, CustomerSummary } from '../models/customer.model';

@Component({
  selector: 'app-customer-list-page',
  imports: [DataTable, EmptyState, PageHeader],
  templateUrl: './customer-list-page.html',
  styleUrl: './customer-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListPage implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly router = inject(Router);

  readonly isSeller = inject(UserContextService).user()?.role === 'VENDEDOR';
  readonly canManage = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.customersManage] });
  readonly loading = signal(false);
  readonly search = signal('');
  readonly summary = signal<CustomerSummary | null>(null);
  private readonly customers = signal<readonly Customer[]>([]);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.customers();
    return this.customers().filter((customer) =>
      `${customer.displayName} ${customer.documentNumber ?? ''} ${customer.email ?? ''}`.toLowerCase().includes(term),
    );
  });

  readonly columns: readonly DataTableColumn<Customer>[] = [
    { key: 'type', label: 'Tipo', value: (row) => (row.type === 'PERSON' ? 'Persona' : 'Empresa') },
    { key: 'name', label: 'Nombre / Razón social', value: (row) => row.displayName },
    { key: 'document', label: 'Documento', value: (row) => `${row.documentType ?? ''} ${row.documentNumber ?? ''}`.trim() || '—' },
    { key: 'email', label: 'Correo', value: (row) => row.email ?? '—' },
    { key: 'phone', label: 'Teléfono', value: (row) => row.phone ?? '—' },
    { key: 'purchases', label: 'Compras total', value: (row) => `S/ ${row.totalPurchases.toFixed(2)}` },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
  ];

  ngOnInit(): void {
    this.api.summary().subscribe((summary) => this.summary.set(summary));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.customers.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(customer: Customer): void {
    void this.router.navigate(['/app/customers', customer.id]);
  }

  selectForSale(customer: Customer): void {
    void this.router.navigate(['/app/pos'], { queryParams: { clientId: customer.id } });
  }

  create(): void {
    void this.router.navigate(['/app/customers/new']);
  }

  clearFilters(): void {
    this.search.set('');
  }

  edit(customer: Customer): void {
    void this.router.navigate(['/app/customers', customer.id, 'edit']);
  }
}

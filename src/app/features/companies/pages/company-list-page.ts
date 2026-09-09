import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { COMPANY_MOCK } from '../data-access/company.mock';
import { CompanyListItem } from '../models/company.model';

@Component({
  selector: 'app-company-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink],
  templateUrl: './company-list-page.html',
  styleUrl: './company-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPage {
  private readonly router = inject(Router);
  readonly search = signal('');
  readonly statusFilter = signal('');
  private readonly companies = signal<readonly CompanyListItem[]>(COMPANY_MOCK);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.companies().filter((company) => {
      const matchesTerm =
        !term || `${company.commercialName} ${company.legalName} ${company.taxId}`.toLowerCase().includes(term);
      return matchesTerm && (!status || company.status === status);
    });
  });

  readonly total = computed(() => this.companies().length);
  readonly activeCount = computed(() => this.companies().filter((company) => company.status === 'ACTIVA').length);

  readonly columns: readonly DataTableColumn<CompanyListItem>[] = [
    { key: 'name', label: 'Nombre comercial', value: (row) => row.commercialName },
    { key: 'legal', label: 'Razón social', value: (row) => row.legalName },
    { key: 'tax', label: 'RUC', value: (row) => row.taxId },
    { key: 'admin', label: 'Administrador', value: (row) => row.administrator },
    { key: 'email', label: 'Correo', value: (row) => row.email },
    { key: 'start', label: 'Alta / inicio', value: (row) => row.startDate },
    { key: 'expiration', label: 'Vencimiento', value: (row) => row.expiration },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
    { key: 'branches', label: 'Locales', value: (row) => row.branches },
    { key: 'users', label: 'Usuarios', value: (row) => row.users },
  ];

  open(company: CompanyListItem): void {
    void this.router.navigate(['/app/companies', company.id]);
  }

  edit(company: CompanyListItem): void {
    void this.router.navigate(['/app/companies', company.id, 'edit']);
  }
}

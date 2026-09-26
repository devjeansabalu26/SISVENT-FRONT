import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { CompanyApiService } from '../data-access/company-api.service';
import { Company, CompanySummary } from '../models/company.model';

@Component({
  selector: 'app-company-list-page',
  imports: [DataTable, PageHeader, KpiCard, RouterLink, Paginator],
  templateUrl: './company-list-page.html',
  styleUrl: './company-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPage implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly summary = signal<CompanySummary | null>(null);
  readonly rows = signal<readonly Company[]>([]);
  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);

  readonly columns: readonly DataTableColumn<Company>[] = [
    { key: 'name', label: 'Nombre comercial', value: (row) => row.tradeName },
    { key: 'legal', label: 'Razón social', value: (row) => row.legalName ?? '—' },
    { key: 'tax', label: 'RUC', value: (row) => row.taxDocument },
    { key: 'admin', label: 'Administrador', value: (row) => row.administratorName ?? '—' },
    { key: 'email', label: 'Correo', value: (row) => row.administratorEmail ?? '—' },
    { key: 'plan', label: 'Plan', value: (row) => row.planName ?? '—' },
    { key: 'expiration', label: 'Vencimiento', value: (row) => row.planEnd ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => row.effectiveStatus, type: 'status' },
    { key: 'stores', label: 'Locales', value: (row) => row.storeCount },
    { key: 'users', label: 'Usuarios', value: (row) => row.userCount },
  ];

  ngOnInit(): void {
    this.api.summary().subscribe((summary) => this.summary.set(summary));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize,
        search: this.search() || undefined,
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
          this.total.set(page.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.pageNumber.set(1);
    this.load();
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  open(company: Company): void {
    void this.router.navigate(['/app/companies', company.id]);
  }

  edit(company: Company): void {
    void this.router.navigate(['/app/companies', company.id, 'edit']);
  }
}

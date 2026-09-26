import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../../shared/ui/data-table/data-table.model';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { CompanyApiService } from '../../../companies/data-access/company-api.service';

interface Row {
  readonly id: string;
  readonly tradeName: string;
  readonly taxDocument: string;
  readonly administratorName: string | null;
  readonly effectiveStatus: string;
  readonly planEnd: string | null;
  readonly storeCount: number;
  readonly userCount: number;
}

/** Tab "Empresas asignadas" del detalle de plan: quiénes están usando este plan HOY, con paginación
 * server-side real — reutiliza GET /api/v1/companies?planId= (mismo endpoint y store que el listado de
 * Empresas), no crea un endpoint aparte. */
@Component({
  selector: 'app-plan-companies-tab',
  imports: [DataTable, Paginator],
  templateUrl: './plan-companies-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCompaniesTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly router = inject(Router);

  readonly planId = input.required<string>();

  readonly loading = signal(false);
  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly Row[]>([]);

  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'name', label: 'Empresa', value: (row) => row.tradeName },
    { key: 'ruc', label: 'RUC', value: (row) => row.taxDocument },
    { key: 'admin', label: 'Administrador', value: (row) => row.administratorName ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => row.effectiveStatus, type: 'status' },
    { key: 'end', label: 'Vigencia hasta', value: (row) => row.planEnd ?? '—' },
    { key: 'stores', label: 'Locales', value: (row) => row.storeCount },
    { key: 'users', label: 'Usuarios', value: (row) => row.userCount },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ planId: this.planId(), pageNumber: this.pageNumber(), pageSize: this.pageSize }).subscribe({
      next: (page) => {
        this.rows.set(
          page.items.map((c) => ({
            id: c.id,
            tradeName: c.tradeName,
            taxDocument: c.taxDocument,
            administratorName: c.administratorName,
            effectiveStatus: c.effectiveStatus,
            planEnd: c.planEnd,
            storeCount: c.storeCount,
            userCount: c.userCount,
          })),
        );
        this.total.set(page.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  view(row: Row): void {
    void this.router.navigate(['/app/companies', row.id]);
  }
}

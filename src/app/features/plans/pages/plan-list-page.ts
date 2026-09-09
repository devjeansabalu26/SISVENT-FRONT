import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { PLAN_FEATURE_MATRIX, PLAN_MOCK } from '../data-access/plan.mock';
import { PlanListItem } from '../models/plan.model';

@Component({
  selector: 'app-plan-list-page',
  imports: [DataTable, PageHeader, RouterLink],
  templateUrl: './plan-list-page.html',
  styleUrl: './plan-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListPage {
  private readonly router = inject(Router);
  readonly rows = signal<readonly PlanListItem[]>(PLAN_MOCK);
  readonly featureMatrix = PLAN_FEATURE_MATRIX;

  open(plan: PlanListItem): void {
    void this.router.navigate(['/app/plans', plan.id]);
  }

  edit(plan: PlanListItem): void {
    void this.router.navigate(['/app/plans', plan.id, 'edit']);
  }

  readonly columns: readonly DataTableColumn<PlanListItem>[] = [
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'name', label: 'Nombre', value: (row) => row.name },
    { key: 'price', label: 'Precio', value: (row) => `S/ ${row.price.toFixed(2)}` },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
    { key: 'sellerLimit', label: 'Vendedores', value: (row) => row.sellerLimit },
    { key: 'localLimit', label: 'Locales', value: (row) => row.localLimit },
    { key: 'modules', label: 'Módulos incluidos', value: (row) => row.modules },
    { key: 'companyCount', label: 'Empresas', value: (row) => row.companyCount },
  ];
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { PlanApiService } from '../data-access/plan-api.service';
import { FeatureMatrix, Plan } from '../models/plan.model';

@Component({
  selector: 'app-plan-list-page',
  imports: [DataTable, PageHeader, RouterLink],
  templateUrl: './plan-list-page.html',
  styleUrl: './plan-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(PlanApiService);

  readonly loading = signal(false);
  readonly rows = signal<readonly Plan[]>([]);
  readonly featureMatrix = signal<FeatureMatrix | null>(null);

  readonly columns: readonly DataTableColumn<Plan>[] = [
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'name', label: 'Nombre', value: (row) => row.name },
    { key: 'price', label: 'Precio', value: (row) => (row.currentPrice != null ? `S/ ${row.currentPrice.toFixed(2)}` : '—') },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
    { key: 'sellerLimit', label: 'Vendedores', value: (row) => row.maxSellers ?? '∞' },
    { key: 'storeLimit', label: 'Locales', value: (row) => row.maxStores ?? '∞' },
    { key: 'features', label: 'Funcionalidades', value: (row) => row.featureCount },
    { key: 'companyCount', label: 'Empresas', value: (row) => row.companyCount },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (plans) => {
        this.rows.set(plans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.featureMatrix().subscribe((matrix) => this.featureMatrix.set(matrix));
  }

  open(plan: Plan): void {
    void this.router.navigate(['/app/plans', plan.id]);
  }

  edit(plan: Plan): void {
    void this.router.navigate(['/app/plans', plan.id, 'edit']);
  }
}

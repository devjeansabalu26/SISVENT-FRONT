import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { PLAN_MOCK } from '../data-access/plan.mock';
import { PlanListItem } from '../models/plan.model';

interface PlanPriceChange {
  readonly date: string;
  readonly previous: string;
  readonly next: string;
  readonly user: string;
}

@Component({
  selector: 'app-plan-detail-page',
  imports: [PageHeader, StatusChip, RouterLink],
  templateUrl: './plan-detail-page.html',
  styleUrl: '../../../shared/ui/detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDetailPage {
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly plan: PlanListItem = PLAN_MOCK.find((item) => item.id === this.id) ?? PLAN_MOCK[0];

  readonly activeTab = signal<'general' | 'companies' | 'history'>('general');

  readonly modules: readonly { readonly group: string; readonly items: readonly string[] }[] = [
    { group: 'Comercial', items: ['Ventas y cobros', 'Clientes', 'Productos y categorías', 'Stock y almacenes'] },
    { group: 'Reportes', items: ['Exportación de reportes básica', 'Reportes por local especializados'] },
    { group: 'Avanzado', items: ['Proveedores e ingresos', 'Auditoría integral de cajeros'] },
  ];

  readonly priceHistory: readonly PlanPriceChange[] = [
    { date: '12 Oct 2023', previous: 'S/ 120.00', next: 'S/ 149.00', user: 'S. Admin Root' },
    { date: '15 Ene 2023', previous: 'S/ 99.00', next: 'S/ 120.00', user: 'Carlos Mendoza' },
  ];
}

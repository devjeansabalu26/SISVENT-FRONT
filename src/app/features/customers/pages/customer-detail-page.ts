import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { CUSTOMER_MOCK } from '../data-access/customer.mock';
import { CustomerListItem } from '../models/customer.model';

interface CustomerSale {
  readonly number: string;
  readonly date: string;
  readonly products: string;
  readonly total: string;
  readonly seller: string;
  readonly status: string;
}

@Component({
  selector: 'app-customer-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink],
  templateUrl: './customer-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './customer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailPage {
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly customer: CustomerListItem = CUSTOMER_MOCK.find((item) => item.id === this.id) ?? CUSTOMER_MOCK[0];

  readonly personal: readonly { label: string; value: string }[] = [
    { label: 'Documento de identidad', value: this.customer.document },
    { label: 'Teléfono móvil', value: this.customer.phone },
    { label: 'Correo electrónico', value: this.customer.email },
    { label: 'Dirección fiscal', value: 'Av. Arequipa 1234, Dpto 402, Lima, Lima' },
  ];

  readonly sales: readonly CustomerSale[] = [
    { number: 'V-1024', date: '15/03/2024', products: 'Audífonos Bluetooth Pro (x1), Cable USB-C (x2)', total: 'S/ 139.90', seller: 'Carlos V.', status: 'Entregado' },
    { number: 'V-0988', date: '02/03/2024', products: 'Teclado Mecánico Redragon (x1)', total: 'S/ 159.00', seller: 'Ana M.', status: 'Entregado' },
    { number: 'V-0912', date: '18/02/2024', products: 'Mouse Inalámbrico Logitech (x1)', total: 'S/ 45.00', seller: 'Carlos V.', status: 'Entregado' },
  ];
}

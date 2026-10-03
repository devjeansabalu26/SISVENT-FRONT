import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { CustomerApiService } from '../data-access/customer-api.service';
import { CustomerDetail } from '../models/customer.model';

@Component({
  selector: 'app-customer-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink, DatePipe],
  templateUrl: './customer-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './customer-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailPage implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly canManage = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.customersManage] });

  readonly loading = signal(true);
  readonly customer = signal<CustomerDetail | null>(null);

  readonly personal = computed(() => {
    const customer = this.customer();
    if (!customer) return [];
    return [
      { label: 'Documento de identidad', value: `${customer.documentType ?? ''} ${customer.documentNumber ?? ''}`.trim() || '—' },
      { label: 'Teléfono móvil', value: customer.phone ?? '—' },
      { label: 'Correo electrónico', value: customer.email ?? '—' },
      { label: 'Dirección', value: customer.address ?? '—' },
      { label: 'Observaciones', value: customer.notes ?? '—' },
    ];
  });

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

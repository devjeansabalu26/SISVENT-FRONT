import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

interface UsageBar {
  readonly label: string;
  readonly detail: string;
  readonly percent: number;
}

interface AvailablePlan {
  readonly name: string;
  readonly price: string;
  readonly current: boolean;
  readonly features: readonly string[];
  readonly cta: string;
}

interface PlanChange {
  readonly date: string;
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

@Component({
  selector: 'app-company-plan-page',
  imports: [PageHeader],
  templateUrl: './company-plan-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-plan-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPlanPage {
  private readonly notifications = inject(NotificationService);

  readonly usage: readonly UsageBar[] = [
    { label: 'Vendedores habilitados', detail: '2 / 3', percent: 67 },
    { label: 'Locales comerciales', detail: '1 / 2', percent: 50 },
    { label: 'Productos registrados', detail: '284 / ilimitado', percent: 28 },
  ];

  readonly plans: readonly AvailablePlan[] = [
    {
      name: 'Esencial',
      price: 'S/ 40.00 / mes',
      current: false,
      features: ['1 vendedor disponible', '1 local de venta', 'Dashboard básico', 'Sin reportes exportables'],
      cta: 'Contactar para cambio',
    },
    {
      name: 'Negocio',
      price: 'S/ 60.00 / mes',
      current: true,
      features: [
        '3 vendedores disponibles',
        '2 locales comerciales',
        'Dashboard analítico avanzado',
        'Reportes automatizados',
        'Módulo de auditoría básica',
      ],
      cta: 'Plan actual',
    },
    {
      name: 'Profesional',
      price: 'S/ 120.00 / mes',
      current: false,
      features: [
        'Vendedores configurables',
        'Locales configurables',
        'Módulo + Proveedores',
        'Abastecimiento automático',
        'Ingreso y control de mercadería',
      ],
      cta: 'Contactar para cambio',
    },
  ];

  readonly history: readonly PlanChange[] = [
    {
      date: '01/09/2026',
      from: 'Esencial',
      to: 'Negocio',
      reason: 'Expansión de operaciones: apertura de segundo local comercial.',
    },
    {
      date: '01/09/2025',
      from: '— (Alta nueva)',
      to: 'Esencial',
      reason: 'Registro inicial del tenant corporativo en el sistema SaaS.',
    },
  ];

  requestChange(plan: AvailablePlan): void {
    if (plan.current) return;
    this.notifications.show(`Solicitud de cambio al plan ${plan.name} registrada. Soporte te contactará.`, 'info');
  }
}

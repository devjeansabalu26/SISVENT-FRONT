import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { PlanChangeDialog } from '../components/plan-change-dialog/plan-change-dialog';
import { ResetAccessDialog } from '../components/reset-access-dialog/reset-access-dialog';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { COMPANY_MOCK } from '../data-access/company.mock';
import { CompanyListItem } from '../models/company.model';

type CompanyTab = 'general' | 'plan' | 'users' | 'locales';

@Component({
  selector: 'app-company-detail-page',
  imports: [PageHeader, StatusChip, KpiCard, RouterLink],
  templateUrl: './company-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly company: CompanyListItem = COMPANY_MOCK.find((item) => item.id === this.id) ?? COMPANY_MOCK[0];
  readonly activeTab = signal<CompanyTab>('general');

  readonly identity: readonly { label: string; value: string }[] = [
    { label: 'Nombre comercial', value: this.company.commercialName },
    { label: 'Razón social', value: this.company.legalName },
    { label: 'RUC', value: this.company.taxId },
    { label: 'Rubro', value: 'Tecnología y accesorios' },
  ];

  readonly contact: readonly { label: string; value: string }[] = [
    { label: 'Teléfono', value: '01-4567890' },
    { label: 'Correo de soporte', value: this.company.email },
    { label: 'Página web', value: 'www.andina.pe' },
    { label: 'Dirección principal', value: 'Av. Arequipa 1234, Miraflores, Lima' },
  ];

  readonly contract: readonly { label: string; value: string }[] = [
    { label: 'Inicio de vigencia', value: this.company.startDate },
    { label: 'Vencimiento', value: this.company.expiration },
    { label: 'Días restantes', value: '365 días' },
    { label: 'Administrador principal', value: this.company.administrator },
  ];

  readonly access: readonly { date: string; ip: string; result: string }[] = [
    { date: '01/09/2026 14:15', ip: '10.0.0.45', result: 'Exitoso' },
    { date: '31/08/2026 09:30', ip: '10.0.0.45', result: 'Exitoso' },
    { date: '30/08/2026 18:22', ip: '190.12.33.4', result: 'Fallido' },
    { date: '28/08/2026 11:05', ip: '10.0.0.45', result: 'Exitoso' },
  ];

  suspend(): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Suspender empresa',
          message: `¿Suspender a ${this.company.commercialName}? Los usuarios asociados no podrán acceder temporalmente.`,
          confirmLabel: 'Suspender',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Empresa suspendida.', 'success'));
  }

  changePlan(): void {
    this.dialog
      .open(PlanChangeDialog, { data: { companyName: this.company.commercialName, currentPlan: 'Plan Negocio' } })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Solicitud de cambio de plan registrada.', 'success'));
  }

  resetAccess(): void {
    this.dialog
      .open(ResetAccessDialog, {
        data: { username: this.company.administrator, companyName: this.company.commercialName },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.notifications.show('Acceso del administrador restablecido.', 'success'));
  }
}

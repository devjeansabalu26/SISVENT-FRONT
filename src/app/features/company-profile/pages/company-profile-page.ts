import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

interface Field {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-company-profile-page',
  imports: [PageHeader],
  templateUrl: './company-profile-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-profile-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfilePage {
  private readonly notifications = inject(NotificationService);
  private readonly company = inject(CompanyContextService).company;

  readonly commercialName = this.company()?.commercialName ?? 'Comercial Andina';

  readonly identity: readonly Field[] = [
    { label: 'Nombre comercial', value: this.commercialName },
    { label: 'Razón social', value: 'Comercial Andina S.A.C.' },
    { label: 'RUC', value: '20601234567' },
    { label: 'Rubro comercial', value: 'Distribuidora de Alimentos y Bebidas' },
  ];

  readonly contact: readonly Field[] = [
    { label: 'Teléfono de contacto', value: '+51 987 654 321' },
    { label: 'Correo electrónico corporativo', value: 'contacto@comercialandina.pe' },
    { label: 'Sitio web', value: 'www.comercialandina.pe' },
  ];

  readonly address: readonly Field[] = [
    { label: 'Dirección completa', value: 'Av. Arequipa 1234, Oficina 501' },
    { label: 'Distrito', value: 'Miraflores' },
    { label: 'Ciudad / Provincia', value: 'Lima' },
    { label: 'Departamento', value: 'Lima' },
  ];

  readonly fiscal: readonly Field[] = [
    { label: 'Tipo de contribuyente', value: 'Persona Jurídica' },
    { label: 'Régimen tributario', value: 'Régimen MYPE Tributario (MYPE)' },
    { label: 'Moneda de facturación', value: 'Sol Peruano (S/.)' },
  ];

  readonly brandColors: readonly Field[] = [
    { label: 'Color primario', value: '#2563EB' },
    { label: 'Color secundario', value: '#10B981' },
    { label: 'Color acento', value: '#F59E0B' },
  ];

  edit(): void {
    this.notifications.show('La edición de la empresa se habilita cuando el endpoint esté disponible.', 'info');
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CompanyProfileApiService } from '../data-access/company-profile-api.service';
import { CompanyProfile } from '../models/company-profile.model';

interface Field {
  readonly label: string;
  readonly value: string;
}

const TAX_REGIMES: Readonly<Record<string, string>> = {
  RUS: 'Nuevo RUS',
  RER: 'Régimen Especial (RER)',
  RMT: 'Régimen MYPE Tributario (RMT)',
  GENERAL: 'Régimen General',
};

const CURRENCIES: Readonly<Record<string, string>> = { PEN: 'Sol peruano (S/)', USD: 'Dólar estadounidense (US$)' };

const STATUS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente',
  SUSPENDED: 'Suspendida',
  INACTIVE: 'Inactiva',
};

const orDash = (value: string | null | undefined): string => (value && value.trim() ? value : '—');

@Component({
  selector: 'app-company-profile-page',
  imports: [PageHeader, RouterLink],
  templateUrl: './company-profile-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-profile-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfilePage implements OnInit {
  private readonly api = inject(CompanyProfileApiService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly profile = signal<CompanyProfile | null>(null);

  readonly identity = computed<readonly Field[]>(() => {
    const p = this.profile();
    if (!p) return [];
    return [
      { label: 'Nombre comercial', value: p.tradeName },
      { label: 'Razón social', value: orDash(p.legalName) },
      { label: 'RUC', value: p.taxDocument },
      { label: 'Rubro comercial', value: orDash(p.businessType) },
      { label: 'Estado', value: STATUS[p.status] ?? p.status },
      { label: 'Plan vigente', value: orDash(p.planName) },
    ];
  });

  readonly contact = computed<readonly Field[]>(() => {
    const p = this.profile();
    if (!p) return [];
    return [
      { label: 'Teléfono de contacto', value: orDash(p.phone) },
      { label: 'Correo electrónico corporativo', value: orDash(p.email) },
      { label: 'Dirección fiscal / principal', value: orDash(p.address) },
    ];
  });

  readonly fiscal = computed<readonly Field[]>(() => {
    const f = this.profile()?.fiscal;
    if (!f) return [];
    return [
      { label: 'Régimen tributario', value: TAX_REGIMES[f.taxRegime] ?? f.taxRegime },
      { label: 'Moneda de facturación', value: CURRENCIES[f.currencyCode] ?? f.currencyCode },
      { label: 'Serie de boletas', value: f.receiptSeries },
      { label: 'Serie de facturas', value: f.invoiceSeries },
    ];
  });

  /** Colores guardados en company_themes al crear/editar la empresa. */
  readonly brandColors = computed<readonly Field[]>(() => {
    const t = this.profile()?.theme;
    if (!t) return [];
    return [
      { label: 'Color primario', value: t.primaryColor },
      { label: 'Color secundario', value: t.secondaryColor },
      { label: 'Color de acento', value: t.accentColor },
      { label: 'Color de fondo', value: t.backgroundColor },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.get().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}

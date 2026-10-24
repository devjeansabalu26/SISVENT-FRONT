import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { CompanyProfileEditDialog } from '../components/company-profile-edit-dialog';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CompanyProfileApiService } from '../data-access/company-profile-api.service';
import { CompanyProfile } from '../models/company-profile.model';
import { RegionalService } from '../../../core/regional/regional.service';
import { Observable } from 'rxjs';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { LogoUploader } from '../../../shared/ui/logo-uploader/logo-uploader';

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

const STATUS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente',
  SUSPENDED: 'Suspendida',
  INACTIVE: 'Inactiva',
};

const orDash = (value: string | null | undefined): string => (value && value.trim() ? value : '—');

@Component({
  selector: 'app-company-profile-page',
  imports: [PageHeader, RouterLink, LogoUploader],
  templateUrl: './company-profile-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss', './company-profile-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfilePage implements OnInit {
  private readonly api = inject(CompanyProfileApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly theme = inject(ThemeService);
  private readonly regional = inject(RegionalService).regional;

  private readonly companies = inject(CompanyContextService);
  readonly savingLogo = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly profile = signal<CompanyProfile | null>(null);

  readonly identity = computed<readonly Field[]>(() => {
    const p = this.profile();
    if (!p) return [];
    return [
      { label: 'Nombre comercial', value: p.tradeName },
      { label: 'Razón social', value: orDash(p.legalName) },
      { label: p.taxIdName ?? 'RUC', value: p.taxDocument },
      { label: 'País', value: p.countryName ?? 'Perú' },
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
    const regional = this.regional();
    const series = regional.series.length
      ? regional.series.map((s) => ({ label: `${s.seriesLabel} de ${s.name}`, value: s.series ?? '—' }))
      : [
          { label: 'Serie de boletas', value: f.receiptSeries },
          { label: 'Serie de facturas', value: f.invoiceSeries },
        ];
    return [
      { label: 'Régimen tributario', value: regional.taxRegimeName ?? TAX_REGIMES[f.taxRegime] ?? f.taxRegime },
      { label: 'Moneda', value: `${regional.currencyCode} (${regional.currencySymbol})` },
      { label: 'Impuesto', value: `${regional.taxName} ${Math.round(regional.taxRate * 10000) / 100} %` },
      ...series,
    ];
  });

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

  edit(): void {
    const profile = this.profile();
    if (!profile) return;
    this.dialog
      .open<CompanyProfileEditDialog, CompanyProfile, CompanyProfile>(CompanyProfileEditDialog, { data: profile })
      .afterClosed()
      .subscribe((saved) => {
        if (!saved) return;
        this.profile.set(saved);
        this.theme.applyCompanyTheme({
          primary: saved.theme.primaryColor,
          secondary: saved.theme.secondaryColor,
          accent: saved.theme.accentColor,
          background: saved.theme.backgroundColor,
        });
        this.notifications.show('Datos de la empresa actualizados.', 'success');
      });
  }

  uploadLogo(file: File, uploader: LogoUploader): void {
    this.saveLogo(this.api.uploadLogo(file), uploader, 'Logo actualizado.');
  }

  removeLogo(uploader: LogoUploader): void {
    this.saveLogo(this.api.removeLogo(), uploader, 'Logo quitado.');
  }

  private saveLogo(request: Observable<{ readonly logoUrl: string | null }>, uploader: LogoUploader, message: string): void {
    this.savingLogo.set(true);
    request.subscribe({
      next: ({ logoUrl }) => {
        this.savingLogo.set(false);
        this.profile.update((p) => (p ? { ...p, theme: { ...p.theme, logoUrl } } : p));
        this.companies.setLogo(logoUrl);
        this.notifications.show(message, 'success');
      },
      error: (cause: unknown) => {
        this.savingLogo.set(false);
        uploader.showError(cause instanceof AppHttpError && cause.message ? cause.message : 'No se pudo guardar el logo.');
      },
    });
  }

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

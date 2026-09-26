import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { DiffField, buildDiffRows } from '../../../shared/utils/diff-rows';
import { SettingsApiService } from '../data-access/settings-api.service';
import { CompanySettings } from '../models/settings.model';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, PageHeader],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private readonly api = inject(SettingsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly activeTab = signal<'general' | 'billing' | 'notifications' | 'security'>('general');
  private version = 0;
  /** Última configuración guardada: base del resumen "Cambios de Configuración" (MOD-AD-19). */
  private saved: CompanySettings | null = null;

  readonly form = new FormGroup({
    currencyCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)],
    }),
    locale: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    timezone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    strictStockControl: new FormControl(true, { nonNullable: true }),
    lowStockAlertEnabled: new FormControl(true, { nonNullable: true }),
    notifyManualAdjustment: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.form.disable();
    this.api.get().subscribe({
      next: (settings) => {
        this.apply(settings);
        this.loading.set(false);
        this.form.enable();
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CompanySettings = {
      ...value,
      currencyCode: value.currencyCode.toUpperCase(),
      version: this.version,
    };

    if (!this.saved) {
      this.persist(request);
      return;
    }
    const fields: readonly DiffField<CompanySettings>[] = [
      { key: 'currencyCode', label: 'Moneda' },
      { key: 'locale', label: 'Idioma / formato regional' },
      { key: 'timezone', label: 'Zona horaria' },
      { key: 'strictStockControl', label: 'Control estricto de stock' },
      { key: 'lowStockAlertEnabled', label: 'Alertas de stock mínimo' },
      { key: 'notifyManualAdjustment', label: 'Notificar ajustes manuales' },
    ];
    const rows = buildDiffRows(this.saved, request, fields);
    if (!rows.length) {
      this.notifications.show('No hay cambios por guardar.', 'info');
      return;
    }
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, {
        data: {
          title: 'Cambios de configuración',
          code: 'MOD-AD-19',
          icon: 'settings',
          intro: 'Verifique las configuraciones del sistema modificadas antes de proceder con el guardado definitivo:',
          diff: { headers: ['Parámetro', 'Antes', 'Después'], rows },
          confirmLabel: 'Guardar cambios',
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.persist(request));
  }

  private persist(request: CompanySettings): void {
    this.saving.set(true);
    this.api.update(request).subscribe({
      next: (settings) => {
        this.apply(settings);
        this.saving.set(false);
        this.notifications.show('Configuración guardada correctamente.', 'success');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.messageFor(cause), 'error');
        if (cause instanceof AppHttpError && cause.status === 409) this.load();
      },
    });
  }

  private apply(settings: CompanySettings): void {
    this.version = settings.version;
    this.saved = settings;
    this.form.reset({
      currencyCode: settings.currencyCode,
      locale: settings.locale,
      timezone: settings.timezone,
      strictStockControl: settings.strictStockControl,
      lowStockAlertEnabled: settings.lowStockAlertEnabled,
      notifyManualAdjustment: settings.notifyManualAdjustment,
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'La configuración cambió en otra sesión. Se recargó con los datos actuales.';
      if (cause.status === 400) return 'Revisa los datos: código de moneda, idioma y zona horaria.';
      if (cause.status === 403) return 'No tienes permiso para editar la configuración.';
    }
    return 'No se pudo guardar la configuración.';
  }
}

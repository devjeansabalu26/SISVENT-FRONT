import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { DateFormat, SettingsExtras, TaxRegime, TicketFormat } from '../models/settings-extras.model';

const TAX_REGIMES: readonly { readonly value: TaxRegime; readonly label: string }[] = [
  { value: 'RUS', label: 'Nuevo RUS' },
  { value: 'RER', label: 'Régimen Especial (RER)' },
  { value: 'RMT', label: 'Régimen MYPE Tributario (RMT)' },
  { value: 'GENERAL', label: 'Régimen General' },
];

const TICKET_FORMATS: readonly { readonly value: TicketFormat; readonly label: string }[] = [
  { value: 'TICKET_80', label: 'Ticket térmico 80 mm' },
  { value: 'TICKET_58', label: 'Ticket térmico 58 mm' },
  { value: 'A4', label: 'Hoja A4' },
];

const DATE_FORMATS: readonly DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const labelOf =
  (options: readonly { readonly value: string; readonly label: string }[]) =>
  (value: unknown): string =>
    options.find((option) => option.value === value)?.label ?? String(value);

/** Campos del resumen "Cambios de Configuración" (MOD-AD-19), en el orden de la pantalla. */
const DIFF_FIELDS: readonly DiffField<CompanySettings>[] = [
  { key: 'taxRegime', label: 'Régimen tributario', format: labelOf(TAX_REGIMES) },
  { key: 'receiptSeries', label: 'Serie de boletas' },
  { key: 'invoiceSeries', label: 'Serie de facturas' },
  { key: 'timezone', label: 'Zona horaria' },
  { key: 'currencyCode', label: 'Moneda' },
  { key: 'dateFormat', label: 'Formato de fecha' },
  { key: 'locale', label: 'Idioma / formato regional' },
  { key: 'strictStockControl', label: 'Control estricto de stock' },
  { key: 'lowStockAlertEnabled', label: 'Alertas de stock mínimo' },
  { key: 'notifyManualAdjustment', label: 'Notificar ajustes manuales' },
  { key: 'autoPrintReceipt', label: 'Impresión automática de comprobante' },
  { key: 'soundEffects', label: 'Efectos de sonido' },
  { key: 'offlineMode', label: 'Operación offline' },
  { key: 'maxDiscountPercent', label: 'Descuento máximo', format: (value) => `${Number(value).toFixed(2)}%` },
  { key: 'ticketFormat', label: 'Formato de comprobante', format: labelOf(TICKET_FORMATS) },
  { key: 'pricesIncludeTax', label: 'Precios incluyen IGV' },
  { key: 'showLogoOnReceipt', label: 'Logo en comprobante' },
  { key: 'receiptFooter', label: 'Mensaje al pie del comprobante' },
  { key: 'autoEmailReceipt', label: 'Enviar comprobante por correo automáticamente' },
  { key: 'notificationEmail', label: 'Correo de notificaciones' },
  { key: 'emailChannel', label: 'Canal: correo electrónico' },
  { key: 'inAppChannel', label: 'Canal: centro de notificaciones' },
  { key: 'notifyPlanExpiry', label: 'Aviso de vencimiento del plan' },
  { key: 'notifyCancelledSale', label: 'Aviso de venta anulada' },
  { key: 'notifyDailySummary', label: 'Resumen diario de ventas' },
  { key: 'strongPasswords', label: 'Contraseñas seguras obligatorias' },
  { key: 'passwordExpiryDays', label: 'Caducidad de contraseña (días)' },
  { key: 'inactivityLogoutMinutes', label: 'Cierre por inactividad (min)' },
];

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, PageHeader],
  templateUrl: './settings-page.html',
  styleUrls: ['../../../shared/forms/switch.scss', './settings-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private readonly api = inject(SettingsApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly taxRegimes = TAX_REGIMES;
  readonly ticketFormats = TICKET_FORMATS;
  readonly dateFormats = DATE_FORMATS;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly activeTab = signal<'general' | 'billing' | 'notifications' | 'security'>('general');
  private version = 0;
  /** Última configuración guardada: base del resumen "Cambios de Configuración" (MOD-AD-19). */
  private saved: CompanySettings | null = null;
  private readonly lastSavedAt = signal<string | null>(null);
  readonly lastSavedLabel = computed(() => {
    const at = this.lastSavedAt();
    if (!at) return '';
    return `Último cambio guardado: ${new Date(at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`;
  });

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

  /** Parámetros ampliados (Datos fiscales, POS, Facturación, Notificaciones, Seguridad). */
  readonly extras = new FormGroup({
    taxRegime: new FormControl<TaxRegime>('RMT', { nonNullable: true }),
    receiptSeries: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[Bb][A-Za-z0-9]{3}$/)],
    }),
    invoiceSeries: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[Ff][A-Za-z0-9]{3}$/)],
    }),
    dateFormat: new FormControl<DateFormat>('DD/MM/YYYY', { nonNullable: true }),
    autoPrintReceipt: new FormControl(true, { nonNullable: true }),
    soundEffects: new FormControl(true, { nonNullable: true }),
    offlineMode: new FormControl(false, { nonNullable: true }),
    maxDiscountPercent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    ticketFormat: new FormControl<TicketFormat>('TICKET_80', { nonNullable: true }),
    pricesIncludeTax: new FormControl(true, { nonNullable: true }),
    showLogoOnReceipt: new FormControl(true, { nonNullable: true }),
    receiptFooter: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    autoEmailReceipt: new FormControl(false, { nonNullable: true }),
    notificationEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(150)],
    }),
    emailChannel: new FormControl(true, { nonNullable: true }),
    inAppChannel: new FormControl(true, { nonNullable: true }),
    notifyPlanExpiry: new FormControl(true, { nonNullable: true }),
    notifyCancelledSale: new FormControl(true, { nonNullable: true }),
    notifyDailySummary: new FormControl(false, { nonNullable: true }),
    strongPasswords: new FormControl(true, { nonNullable: true }),
    passwordExpiryDays: new FormControl(90, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(365)],
    }),
    inactivityLogoutMinutes: new FormControl(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(5), Validators.max(240)],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.form.disable();
    this.extras.disable();
    this.api.get().subscribe({
      next: (settings) => {
        this.apply(settings);
        this.loading.set(false);
        this.form.enable();
        this.extras.enable();
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.extras.invalid) {
      this.form.markAllAsTouched();
      this.extras.markAllAsTouched();
      this.notifications.show('Revisa los campos marcados antes de guardar (pueden estar en otra pestaña).', 'warning');
      return;
    }

    const value = this.form.getRawValue();
    const request: CompanySettings = {
      ...value,
      ...this.normalizedExtras(),
      currencyCode: value.currencyCode.toUpperCase(),
      version: this.version,
    };

    if (!this.saved) {
      this.persist(request);
      return;
    }
    const rows = buildDiffRows(this.saved, request, DIFF_FIELDS);
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

  /** Botón "Restablecer" (Figma): descarta lo no guardado y vuelve a los últimos valores guardados. */
  restore(): void {
    if (!this.saved) return;
    this.apply(this.saved);
    this.notifications.show('Se restablecieron los últimos valores guardados.', 'info');
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

  /** Normaliza el formulario ampliado; `''` en correo/pie le indica al backend que borre el valor. */
  private normalizedExtras(): SettingsExtras {
    const value = this.extras.getRawValue();
    return {
      ...value,
      receiptSeries: value.receiptSeries.trim().toUpperCase(),
      invoiceSeries: value.invoiceSeries.trim().toUpperCase(),
      receiptFooter: value.receiptFooter.trim(),
      notificationEmail: value.notificationEmail.trim(),
      maxDiscountPercent: Number(value.maxDiscountPercent),
      passwordExpiryDays: Number(value.passwordExpiryDays),
      inactivityLogoutMinutes: Number(value.inactivityLogoutMinutes),
    };
  }

  private apply(settings: CompanySettings): void {
    this.version = settings.version;
    this.saved = settings;
    this.lastSavedAt.set(settings.updatedAt ?? null);
    this.form.reset({
      currencyCode: settings.currencyCode,
      locale: settings.locale,
      timezone: settings.timezone,
      strictStockControl: settings.strictStockControl,
      lowStockAlertEnabled: settings.lowStockAlertEnabled,
      notifyManualAdjustment: settings.notifyManualAdjustment,
    });
    this.extras.reset({
      taxRegime: settings.taxRegime,
      receiptSeries: settings.receiptSeries,
      invoiceSeries: settings.invoiceSeries,
      dateFormat: settings.dateFormat,
      autoPrintReceipt: settings.autoPrintReceipt,
      soundEffects: settings.soundEffects,
      offlineMode: settings.offlineMode,
      maxDiscountPercent: settings.maxDiscountPercent,
      ticketFormat: settings.ticketFormat,
      pricesIncludeTax: settings.pricesIncludeTax,
      showLogoOnReceipt: settings.showLogoOnReceipt,
      receiptFooter: settings.receiptFooter ?? '',
      autoEmailReceipt: settings.autoEmailReceipt ?? false,
      notificationEmail: settings.notificationEmail ?? '',
      emailChannel: settings.emailChannel,
      inAppChannel: settings.inAppChannel,
      notifyPlanExpiry: settings.notifyPlanExpiry,
      notifyCancelledSale: settings.notifyCancelledSale,
      notifyDailySummary: settings.notifyDailySummary,
      strongPasswords: settings.strongPasswords,
      passwordExpiryDays: settings.passwordExpiryDays,
      inactivityLogoutMinutes: settings.inactivityLogoutMinutes,
    });
  }

  private messageFor(cause: unknown): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'La configuración cambió en otra sesión. Se recargó con los datos actuales.';
      if (cause.status === 400) return this.problemTitle(cause) ?? 'Revisa los datos ingresados.';
      if (cause.status === 403) return 'No tienes permiso para editar la configuración.';
    }
    return 'No se pudo guardar la configuración.';
  }

  /** El backend explica la validación en el `title` del ProblemDetails (p. ej. "La serie de boletas debe empezar con B…"). */
  private problemTitle(cause: AppHttpError): string | null {
    const body = (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error;
    if (!body || body.errors) return null; // Validación automática de ASP.NET: título genérico en inglés.
    return typeof body.title === 'string' && body.title.trim() ? body.title : null;
  }
}

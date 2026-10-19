import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../../../shared/ui/confirm-dialog/confirm-dialog.model';
import { CountryApiService } from '../../../countries/data-access/country-api.service';
import {
  CompanyRegional,
  CountryDetail,
  CountryListItem,
  Currency,
  DATE_FORMATS,
  UpdateCompanyRegional,
  problemCode,
  problemTitle,
} from '../../../countries/models/country.model';

@Component({
  selector: 'app-company-regional-tab',
  imports: [ReactiveFormsModule, DateTimePipe],
  templateUrl: './company-regional-tab.html',
  styleUrl: './company-regional-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyRegionalTab implements OnInit {
  private readonly api = inject(CountryApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly companyId = input.required<string>();
  readonly changed = output<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly data = signal<CompanyRegional | null>(null);
  readonly countries = signal<readonly CountryListItem[]>([]);
  readonly currencies = signal<readonly Currency[]>([]);
  readonly country = signal<CountryDetail | null>(null);
  readonly dateFormats = DATE_FORMATS;

  readonly form = new FormGroup({
    countryCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currencyCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    locale: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    timezone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFormat: new FormControl('DD/MM/YYYY', { nonNullable: true, validators: [Validators.required] }),
    taxRatePercent: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(99.99)] }),
    taxRegime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxDocument: new FormControl('', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  private readonly countryCode = signal('');
  readonly countryChanged = computed(() => !!this.data() && this.countryCode() !== this.data()!.countryCode);
  readonly countryLocked = computed(() => this.data()?.lockedFields.includes('countryCode') ?? false);
  readonly currencyLocked = computed(() => this.data()?.lockedFields.includes('currencyCode') ?? false);
  readonly selectableCountries = computed(() =>
    this.countries().filter((c) => c.isActive || c.code === this.data()?.countryCode),
  );
  readonly selectableCurrencies = computed(() =>
    this.currencies().filter((c) => c.isActive || c.code === this.data()?.currencyCode),
  );
  readonly regimes = computed(() => (this.country()?.taxRegimes ?? []).filter((r) => r.isActive));
  readonly timezones = computed(() => this.country()?.timezones ?? []);

  ngOnInit(): void {
    this.api.list().subscribe({ next: (rows) => this.countries.set(rows) });
    this.api.currencies().subscribe({ next: (rows) => this.currencies.set(rows) });
    this.reload();
    this.form.controls.countryCode.valueChanges.subscribe((code) => this.onCountry(code));
  }

  private reload(): void {
    this.loading.set(true);
    this.api.companyRegional(this.companyId()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.countryCode.set(data.countryCode);
        this.form.reset(
          {
            countryCode: data.countryCode,
            currencyCode: data.currencyCode,
            locale: data.locale,
            timezone: data.timezone,
            dateFormat: data.dateFormat,
            taxRatePercent: Math.round(data.taxRate * 10000) / 100,
            taxRegime: data.taxRegime,
            taxDocument: data.taxDocument,
            reason: '',
          },
          { emitEvent: false },
        );
        if (data.lockedFields.includes('countryCode')) this.form.controls.countryCode.disable({ emitEvent: false });
        else this.form.controls.countryCode.enable({ emitEvent: false });
        if (data.lockedFields.includes('currencyCode')) this.form.controls.currencyCode.disable({ emitEvent: false });
        else this.form.controls.currencyCode.enable({ emitEvent: false });
        this.loadCountry(data.countryCode, false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar la configuración regional.', 'error');
      },
    });
  }

  private onCountry(code: string): void {
    this.countryCode.set(code);
    this.loadCountry(code, code !== this.data()?.countryCode);
  }

  private loadCountry(code: string, applyDefaults: boolean): void {
    if (!code) return;
    this.api.get(code).subscribe({
      next: (country) => {
        this.country.set(country);
        if (!applyDefaults) return;
        this.form.patchValue({
          currencyCode: country.defaultCurrencyCode,
          locale: country.defaultLocale,
          timezone: country.defaultTimezone,
          dateFormat: country.defaultDateFormat,
          taxRatePercent: Math.round(country.defaultTaxRate * 10000) / 100,
          taxRegime: country.defaultTaxRegimeCode ?? country.taxRegimes.find((r) => r.isActive)?.code ?? '',
          taxDocument: '',
        });
      },
      error: () => this.notifications.show('No se pudo cargar el país elegido.', 'error'),
    });
  }

  discard(): void {
    const data = this.data();
    if (!data) return;
    this.form.controls.countryCode.setValue(data.countryCode);
    this.reload();
  }

  save(): void {
    const data = this.data();
    if (!data || this.saving()) return;
    if (this.form.invalid || (this.countryChanged() && !this.form.controls.taxDocument.value.trim())) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body: UpdateCompanyRegional = {
      countryCode: value.countryCode,
      currencyCode: value.currencyCode,
      locale: value.locale.trim(),
      timezone: value.timezone,
      dateFormat: value.dateFormat,
      taxRate: Math.round(value.taxRatePercent * 100) / 10000,
      taxRegime: value.taxRegime,
      taxDocument: this.countryChanged() ? value.taxDocument.trim() : null,
      version: data.version,
      reason: value.reason.trim(),
      confirmTimezoneChange: false,
    };
    if (body.timezone !== data.timezone && data.hasSales) {
      this.dialog
        .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
          data: {
            title: 'Cambiar la zona horaria',
            message:
              'La empresa ya tiene ventas. Las ventas cercanas a medianoche pueden pasar a otro día y los cierres de caja ya guardados no se recalculan.',
            acknowledgeLabel: 'Entiendo cómo afecta a los reportes y cierres',
            confirmLabel: 'Cambiar zona horaria',
            destructive: true,
          },
        })
        .afterClosed()
        .pipe(filter(Boolean))
        .subscribe(() => this.persist({ ...body, confirmTimezoneChange: true }));
      return;
    }
    this.persist(body);
  }

  private persist(body: UpdateCompanyRegional): void {
    this.saving.set(true);
    this.api.updateCompanyRegional(this.companyId(), body).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.show('Configuración regional actualizada.', 'success');
        this.changed.emit();
        this.reload();
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        const fallback = problemCode(cause) === 'REGIONAL_LOCKED'
          ? 'La empresa ya tiene ventas: no se puede cambiar el país ni la moneda.'
          : 'No se pudo guardar la configuración regional.';
        this.notifications.show(problemTitle(cause, fallback), 'error');
      },
    });
  }
}

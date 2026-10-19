import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CountryApiService } from '../data-access/country-api.service';
import {
  CHECK_DIGITS,
  CountryDetail,
  CountryDocumentType,
  CountryFields,
  CountryReceiptType,
  CountryTaxRegime,
  CountryTimezone,
  Currency,
  DATE_FORMATS,
  problemTitle,
} from '../models/country.model';

const text = (value = '', required = false) =>
  new FormControl(value, { nonNullable: true, validators: required ? [Validators.required] : [] });

function documentRow(d?: CountryDocumentType) {
  return new FormGroup({
    code: text(d?.code ?? '', true),
    name: text(d?.name ?? '', true),
    placeholder: text(d?.placeholder ?? ''),
    pattern: text(d?.pattern ?? '^[A-Z0-9]{5,15}$', true),
    checkDigit: text(d?.checkDigit ?? ''),
    isBusiness: new FormControl(d?.isBusiness ?? false, { nonNullable: true }),
    isDefault: new FormControl(d?.isDefault ?? false, { nonNullable: true }),
    isActive: new FormControl(d?.isActive ?? true, { nonNullable: true }),
  });
}

function regimeRow(r?: CountryTaxRegime) {
  return new FormGroup({
    code: text(r?.code ?? '', true),
    name: text(r?.name ?? '', true),
    isActive: new FormControl(r?.isActive ?? true, { nonNullable: true }),
  });
}

function timezoneRow(t?: CountryTimezone) {
  return new FormGroup({ timezone: text(t?.timezone ?? '', true), name: text(t?.name ?? '', true) });
}

function receiptRow(r?: CountryReceiptType) {
  return new FormGroup({
    code: text(r?.code ?? '', true),
    name: text(r?.name ?? '', true),
    seriesLabel: text(r?.seriesLabel ?? 'Serie', true),
    seriesPattern: text(r?.seriesPattern ?? '^[A-Z0-9-]{1,10}$', true),
    seriesPlaceholder: text(r?.seriesPlaceholder ?? ''),
    defaultSeries: text(r?.defaultSeries ?? ''),
    forBusinessClient: new FormControl(r?.forBusinessClient ?? false, { nonNullable: true }),
    isActive: new FormControl(r?.isActive ?? true, { nonNullable: true }),
  });
}

const blank = (value: string): string | null => (value.trim() ? value.trim() : null);

@Component({
  selector: 'app-country-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './country-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './country-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryFormPage implements OnInit {
  private readonly api = inject(CountryApiService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly code = inject(ActivatedRoute).snapshot.paramMap.get('code');

  readonly isEdit = !!this.code;
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly country = signal<CountryDetail | null>(null);
  readonly currencies = signal<readonly Currency[]>([]);
  readonly dateFormats = DATE_FORMATS;
  readonly checkDigits = CHECK_DIGITS;

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)] }),
    name: text('', true),
    defaultCurrencyCode: text('', true),
    defaultLocale: text('es-', true),
    defaultTimezone: text('', true),
    defaultDateFormat: text('DD/MM/YYYY', true),
    defaultTaxRegimeCode: text(''),
    taxName: text('IVA', true),
    taxRatePercent: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(99.99)] }),
    pricesIncludeTaxDefault: new FormControl(true, { nonNullable: true }),
    taxIdName: text('', true),
    taxIdLabel: text('', true),
    taxIdPlaceholder: text(''),
    taxIdPattern: text('', true),
    taxIdCheckDigit: text(''),
    phonePrefix: text(''),
    eInvoicingAuthority: text(''),
    activationBlocker: text(''),
    documentTypes: new FormArray([documentRow({ code: 'PAS', name: 'Pasaporte', placeholder: null, pattern: '^[A-Z0-9]{5,15}$', checkDigit: null, isBusiness: false, isDefault: true, sortOrder: 1, isActive: true })]),
    taxRegimes: new FormArray([regimeRow({ code: 'GENERAL', name: 'Régimen general', sortOrder: 1, isActive: true })]),
    timezones: new FormArray([timezoneRow()]),
    receiptTypes: new FormArray([receiptRow({ code: 'VENTA', name: 'Comprobante de venta', seriesLabel: 'Serie', seriesPattern: '^[A-Z0-9-]{1,10}$', seriesPlaceholder: '001', defaultSeries: null, forBusinessClient: false, sortOrder: 1, isActive: true })]),
  });

  get documents() { return this.form.controls.documentTypes; }
  get regimes() { return this.form.controls.taxRegimes; }
  get zones() { return this.form.controls.timezones; }
  get receipts() { return this.form.controls.receiptTypes; }

  ngOnInit(): void {
    this.api.currencies().subscribe({ next: (rows) => this.currencies.set(rows) });
    if (!this.code) return;
    this.form.controls.code.disable();
    this.api.get(this.code).subscribe({
      next: (country) => this.apply(country),
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudo cargar el país.', 'error');
      },
    });
  }

  private apply(country: CountryDetail): void {
    this.country.set(country);
    this.form.patchValue({
      code: country.code,
      name: country.name,
      defaultCurrencyCode: country.defaultCurrencyCode,
      defaultLocale: country.defaultLocale,
      defaultTimezone: country.defaultTimezone,
      defaultDateFormat: country.defaultDateFormat,
      defaultTaxRegimeCode: country.defaultTaxRegimeCode ?? '',
      taxName: country.taxName,
      taxRatePercent: Math.round(country.defaultTaxRate * 10000) / 100,
      pricesIncludeTaxDefault: country.pricesIncludeTaxDefault,
      taxIdName: country.taxIdName,
      taxIdLabel: country.taxIdLabel,
      taxIdPlaceholder: country.taxIdPlaceholder ?? '',
      taxIdPattern: country.taxIdPattern,
      taxIdCheckDigit: country.taxIdCheckDigit ?? '',
      phonePrefix: country.phonePrefix ?? '',
      eInvoicingAuthority: country.eInvoicingAuthority ?? '',
      activationBlocker: country.activationBlocker ?? '',
    });
    this.reset(this.documents, country.documentTypes.map(documentRow));
    this.reset(this.regimes, country.taxRegimes.map(regimeRow));
    this.reset(this.zones, country.timezones.map(timezoneRow));
    this.reset(this.receipts, country.receiptTypes.map(receiptRow));
    this.loading.set(false);
  }

  private reset<T extends FormGroup>(array: FormArray<T>, rows: readonly T[]): void {
    array.clear();
    rows.forEach((row) => array.push(row));
  }

  addDocument(): void { this.documents.push(documentRow()); }
  addRegime(): void { this.regimes.push(regimeRow()); }
  addZone(): void { this.zones.push(timezoneRow()); }
  addReceipt(): void { this.receipts.push(receiptRow()); }
  removeAt(array: FormArray, index: number): void { array.removeAt(index); }

  markDefault(index: number): void {
    this.documents.controls.forEach((row, i) => row.controls.isDefault.setValue(i === index));
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.notifications.show('Revisa los campos obligatorios del país.', 'error');
      return;
    }
    const v = this.form.getRawValue();
    const body: CountryFields = {
      code: v.code.trim().toUpperCase(),
      name: v.name.trim(),
      defaultCurrencyCode: v.defaultCurrencyCode,
      defaultLocale: v.defaultLocale.trim(),
      defaultTimezone: v.defaultTimezone.trim(),
      defaultDateFormat: v.defaultDateFormat,
      defaultTaxRegimeCode: blank(v.defaultTaxRegimeCode),
      taxName: v.taxName.trim(),
      defaultTaxRate: Math.round(v.taxRatePercent * 100) / 10000,
      pricesIncludeTaxDefault: v.pricesIncludeTaxDefault,
      taxIdName: v.taxIdName.trim(),
      taxIdLabel: v.taxIdLabel.trim(),
      taxIdPlaceholder: blank(v.taxIdPlaceholder),
      taxIdPattern: v.taxIdPattern.trim(),
      taxIdCheckDigit: blank(v.taxIdCheckDigit),
      phonePrefix: blank(v.phonePrefix),
      eInvoicingAuthority: blank(v.eInvoicingAuthority),
      activationBlocker: blank(v.activationBlocker),
      documentTypes: v.documentTypes.map((d, i) => ({
        ...d, placeholder: blank(d.placeholder), checkDigit: blank(d.checkDigit), sortOrder: i + 1,
      })),
      taxRegimes: v.taxRegimes.map((r, i) => ({ ...r, sortOrder: i + 1 })),
      timezones: v.timezones.map((t, i) => ({ timezone: t.timezone.trim(), name: t.name.trim(), sortOrder: i + 1 })),
      receiptTypes: v.receiptTypes.map((r, i) => ({
        ...r, seriesPlaceholder: blank(r.seriesPlaceholder), defaultSeries: blank(r.defaultSeries), sortOrder: i + 1,
      })),
    };
    this.saving.set(true);
    const request = this.code ? this.api.update(this.code, body) : this.api.create(body);
    request.subscribe({
      next: (country) => {
        this.saving.set(false);
        this.notifications.show(this.code ? 'País actualizado.' : 'País creado (inactivo hasta que lo actives).', 'success');
        if (this.code) this.apply(country);
        else void this.router.navigate(['/app/countries', country.code]);
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(problemTitle(cause, 'No se pudo guardar el país.'), 'error');
      },
    });
  }

  toggleActive(): void {
    const country = this.country();
    if (!country || this.saving()) return;
    this.saving.set(true);
    this.api.setActive(country.code, !country.isActive).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.apply(updated);
        this.notifications.show(updated.isActive ? `${updated.name} ya está disponible para nuevas empresas.` : `${updated.name} se desactivó.`, 'success');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(problemTitle(cause, 'No se pudo cambiar el estado del país.'), 'error');
      },
    });
  }
}

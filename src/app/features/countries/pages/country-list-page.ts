import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CountryApiService } from '../data-access/country-api.service';
import { CountryListItem, Currency, problemTitle } from '../models/country.model';

type CountryRow = CountryListItem & { readonly id: string };
type CurrencyRow = Currency & { readonly id: string };

@Component({
  selector: 'app-country-list-page',
  imports: [DataTable, PageHeader, RouterLink, ReactiveFormsModule],
  templateUrl: './country-list-page.html',
  styleUrl: './country-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryListPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(CountryApiService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly countries = signal<readonly CountryRow[]>([]);
  readonly currencies = signal<readonly CurrencyRow[]>([]);
  readonly editingCurrency = signal<string | null>(null);
  readonly savingCurrency = signal(false);

  readonly countryColumns: readonly DataTableColumn<CountryRow>[] = [
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'name', label: 'País', value: (row) => row.name },
    { key: 'currency', label: 'Moneda', value: (row) => row.currencyCode },
    { key: 'tax', label: 'Impuesto', value: (row) => `${row.taxName} ${Math.round(row.taxRate * 10000) / 100} %` },
    { key: 'taxId', label: 'Documento fiscal', value: (row) => row.taxIdName },
    { key: 'authority', label: 'Autoridad', value: (row) => row.eInvoicingAuthority ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
    { key: 'companies', label: 'Empresas', value: (row) => row.companyCount },
  ];

  readonly currencyColumns: readonly DataTableColumn<CurrencyRow>[] = [
    { key: 'code', label: 'Código', value: (row) => row.code },
    { key: 'name', label: 'Moneda', value: (row) => row.name },
    { key: 'symbol', label: 'Símbolo', value: (row) => row.symbol },
    { key: 'decimals', label: 'Decimales', value: (row) => row.decimals },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
  ];

  readonly currencyForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    symbol: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(8)] }),
    decimals: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(4)] }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.countries.set(rows.map((row) => ({ ...row, id: row.code })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar los países.', 'error');
      },
    });
    this.api.currencies().subscribe({
      next: (rows) => this.currencies.set(rows.map((row) => ({ ...row, id: row.code }))),
    });
  }

  open(row: CountryRow): void {
    void this.router.navigate(['/app/countries', row.code]);
  }

  newCurrency(): void {
    this.editingCurrency.set('');
    this.currencyForm.reset({ code: '', name: '', symbol: '', decimals: 2, isActive: true });
    this.currencyForm.controls.code.enable();
  }

  editCurrency(row: CurrencyRow): void {
    this.editingCurrency.set(row.code);
    this.currencyForm.reset({ code: row.code, name: row.name, symbol: row.symbol, decimals: row.decimals, isActive: row.isActive });
    this.currencyForm.controls.code.disable();
  }

  cancelCurrency(): void {
    this.editingCurrency.set(null);
  }

  saveCurrency(): void {
    if (this.currencyForm.invalid || this.savingCurrency()) {
      this.currencyForm.markAllAsTouched();
      return;
    }
    const value = this.currencyForm.getRawValue();
    const body: Currency = { ...value, code: value.code.trim().toUpperCase(), name: value.name.trim(), symbol: value.symbol.trim() };
    const editing = this.editingCurrency();
    const request = editing ? this.api.updateCurrency(editing, body) : this.api.createCurrency(body);
    this.savingCurrency.set(true);
    request.subscribe({
      next: () => {
        this.savingCurrency.set(false);
        this.editingCurrency.set(null);
        this.notifications.show(editing ? 'Moneda actualizada.' : 'Moneda creada.', 'success');
        this.load();
      },
      error: (cause: unknown) => {
        this.savingCurrency.set(false);
        this.notifications.show(problemTitle(cause, 'No se pudo guardar la moneda.'), 'error');
      },
    });
  }
}

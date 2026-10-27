import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { applyDocumentType, defaultDocumentType, documentLengthHint, documentLengthRule, documentOptions } from '../../../../core/regional/document-types';
import { RegionalService } from '../../../../core/regional/regional.service';
import { CustomerApiService } from '../../data-access/customer-api.service';
import { Customer, CustomerDetail } from '../../models/customer.model';
import { toCustomer } from '../../utils/to-customer';
import { AccessControlService } from '../../../../core/auth/services/access-control.service';
import { PosApiService, RUC_LOOKUP_BLOCKED, RucLookupResult } from '../../../sales/data-access/pos-api.service';
import { problemCode, problemTitle } from '../../../countries/models/country.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { INVOICE_FEATURE, isValidRuc } from '../../../sales/utils/sale-document';

@Component({
  selector: 'app-customer-quick-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="save()">
      <header>
        <span class="material-icons">person_add</span>
        <div>
          <h2>Nuevo cliente</h2>
          <p>Registro rápido para asociarlo a la venta en curso</p>
        </div>
      </header>

      <div class="fields two">
        <label
          >Tipo de documento *
          <select formControlName="documentType">
            @for (type of documentTypes(); track type.code) {
              <option [value]="type.code" [title]="type.name">{{ type.code }}</option>
            }
          </select>
        </label>
        <label
          >Número de documento *
          <span class="ruc-search">
            <input formControlName="documentNumber" [placeholder]="selectedType()?.placeholder ?? ''" (keydown.enter)="onEnter($event)"
              [attr.maxlength]="lengthRule().max" [attr.inputmode]="lengthRule().digitsOnly ? 'numeric' : null" autocomplete="off" />
            @if (canLookup() && isRuc()) {
              <button type="button" (click)="lookup()" [disabled]="lookingUp()" aria-label="Buscar RUC">
                <span class="material-icons">{{ lookingUp() ? 'hourglass_top' : 'search' }}</span>
              </button>
            }
          </span>
          <small class="help" [attr.data-kind]="documentHelp().kind" [title]="documentHelp().text">{{ documentHelp().text }}</small>
        </label>
        <label class="wide"
          >Nombre o razón social *
          <input formControlName="displayName" />
          <small class="help" data-kind="error">{{ form.controls.displayName.touched && form.controls.displayName.invalid ? 'El nombre es obligatorio.' : '' }}</small>
        </label>
        <label
          >Teléfono *
          <input formControlName="phone" inputmode="tel" />
          <small class="help" data-kind="error">{{ form.controls.phone.touched && form.controls.phone.invalid ? 'El teléfono es obligatorio.' : '' }}</small>
        </label>
        <label
          >Correo
          <input formControlName="email" type="email" />
          <small class="help" data-kind="error">{{ form.controls.email.touched && form.controls.email.invalid ? 'Correo no válido.' : '' }}</small>
        </label>
        <label class="wide"
          >Dirección
          <input formControlName="address" maxlength="350" />
          <small class="help"></small>
        </label>
      </div>

      @if (error()) {
        <p class="hint">{{ error() }}</p>
      }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="saving() || lookingUp()">{{ existing() ? 'Usar cliente registrado' : 'Guardar cliente' }}</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .ruc-search { display: flex; gap: 6px; }
    .ruc-search input { flex: 1; min-width: 0; }
    .ruc-search button { display: inline-flex; align-items: center; justify-content: center; width: var(--control-height); padding: 0; }
    .help { display: block; min-height: 18px; line-height: 18px; overflow: hidden; color: var(--color-text-muted); font-size: 12px; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; }
    .help[data-kind='ok'] { color: var(--color-success); }
    .help[data-kind='warn'] { color: var(--color-warning); }
    .help[data-kind='error'] { color: var(--color-danger); }
    label { align-content: start; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerQuickDialog {
  private readonly api = inject(CustomerApiService);
  private readonly dialogRef = inject(MatDialogRef<CustomerQuickDialog, Customer | undefined>);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private readonly access = inject(AccessControlService);
  private readonly posApi = inject(PosApiService);
  readonly canLookup = computed(() => this.access.hasFeature(INVOICE_FEATURE));
  readonly lookingUp = signal(false);
  readonly found = signal<RucLookupResult | null>(null);
  readonly existing = signal<CustomerDetail | null>(null);
  readonly blocked = signal<string | null>(null);
  private readonly notifications = inject(NotificationService);
  private lookedUp = '';
  private autoFilled = false;

  readonly form = new FormGroup({
    documentType: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(350)] }),
  });

  private readonly regional = inject(RegionalService);
  private readonly documentType = toSignal(this.form.controls.documentType.valueChanges, {
    initialValue: this.form.controls.documentType.value,
  });
  readonly documentTypes = computed(() => documentOptions(this.regional.documentTypes(), null));
  readonly selectedType = computed(() => this.documentTypes().find((type) => type.code === this.documentType()));
  readonly isRuc = computed(() => this.documentType() === 'RUC');
  private readonly documentNumber = toSignal(this.form.controls.documentNumber.valueChanges, { initialValue: '' });
  readonly lengthRule = computed(() => documentLengthRule(this.selectedType()));
  readonly lengthHint = computed(() => documentLengthHint(this.selectedType(), this.documentNumber()));
  readonly rucCheckFailed = computed(() => {
    const value = this.documentNumber().trim();
    return this.isRuc() && value.length === 11 && !isValidRuc(value);
  });
  private readonly touchedTick = signal(0);
  readonly documentHelp = computed((): { readonly text: string; readonly kind: 'muted' | 'ok' | 'warn' | 'error' } => {
    this.touchedTick();
    const hint = this.lengthHint();
    if (hint) return { text: hint, kind: 'muted' };
    if (this.rucCheckFailed()) return { text: 'El RUC no es válido: el dígito verificador no coincide.', kind: 'error' };
    if (this.isRuc() && this.blocked()) return { text: this.blocked()!, kind: 'error' };
    if (this.lookingUp()) return { text: 'Buscando…', kind: 'muted' };
    const result = this.found();
    if (result) {
      const kind = result.warning ? 'warn' : result.source === 'NO_ENCONTRADO' ? 'muted' : 'ok';
      return { text: [this.sourceText(result), result.warning].filter(Boolean).join(' '), kind };
    }
    const control = this.form.controls.documentNumber;
    if (control.touched && control.invalid) return { text: `Ingresa un ${this.selectedType()?.name ?? 'documento'} válido.`, kind: 'error' };
    return { text: '', kind: 'muted' };
  });

  constructor() {
    this.form.controls.documentType.valueChanges.subscribe(() => {
      applyDocumentType(this.form.controls.documentNumber, this.selectedType());
      this.clearLookup();
    });
    this.form.controls.documentNumber.valueChanges.subscribe((value) => {
      const rule = this.lengthRule();
      const cleaned = rule.digitsOnly ? value.replace(/\D/g, '') : value.toUpperCase().replace(/\s/g, '');
      if (cleaned !== value) {
        this.form.controls.documentNumber.setValue(cleaned);
        return;
      }
      const number = cleaned.trim();
      if (number !== this.lookedUp) this.clearLookup();
      if (number !== this.lookedUp && this.isComplete(number)) this.lookup();
    });
    this.form.controls.documentNumber.statusChanges.subscribe(() => this.touchedTick.update((tick) => tick + 1));
    void this.regional.loadDocumentTypes().then((types) => {
      this.form.controls.documentType.setValue(defaultDocumentType(types));
      applyDocumentType(this.form.controls.documentNumber, this.selectedType());
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  onEnter(event: Event): void {
    if (!this.canLookup() || !this.isRuc()) return;
    event.preventDefault();
    this.lookup();
  }

  private isComplete(number: string): boolean {
    const rule = this.lengthRule();
    if (number.length < rule.min || number.length > rule.max) return false;
    return this.isRuc() ? isValidRuc(number) : !this.form.controls.documentNumber.invalid;
  }

  lookup(): void {
    const ruc = this.form.controls.documentNumber.value.trim();
    if (this.lookingUp()) return;
    if (!this.isComplete(ruc)) {
      this.form.controls.documentNumber.markAsTouched();
      return;
    }
    if (!this.canLookup() || !this.isRuc() || this.blocked()) {
      this.findExistingClient(ruc);
      return;
    }
    this.lookedUp = ruc;
    this.lookingUp.set(true);
    this.posApi.lookupRuc(ruc).subscribe({
      next: (result) => {
        this.lookingUp.set(false);
        if (this.form.controls.documentNumber.value.trim() !== result.ruc) return;
        if (result.warning) this.notifications.show(result.warning, 'warning');
        if (result.source === 'CLIENTE' && result.clientId) {
          this.loadExisting(result.clientId, result);
          return;
        }
        this.found.set(result);
        if (result.source === 'SUNAT') this.fill({ displayName: result.legalName ?? '', address: result.address ?? '' });
      },
      error: (cause: unknown) => {
        this.lookingUp.set(false);
        this.lookedUp = '';
        if (problemCode(cause) === RUC_LOOKUP_BLOCKED) {
          const message = problemTitle(cause, 'Tu consulta de RUC está bloqueada.');
          this.blocked.set(message);
          this.notifications.show(message, 'error');
          this.findExistingClient(ruc);
          return;
        }
        this.found.set({ ruc, source: 'NO_ENCONTRADO', clientId: null, legalName: null, address: null, status: null, condition: null, externalConfigured: false, message: 'No se pudo buscar el RUC. Escribe la razón social.' });
      },
    });
  }

  private findExistingClient(number: string): void {
    this.lookedUp = number;
    this.lookingUp.set(true);
    this.api.list({ pageSize: 10, search: number }).subscribe({
      next: (page) => {
        this.lookingUp.set(false);
        if (this.form.controls.documentNumber.value.trim() !== number) return;
        const match = page.items.find((item) => item.documentNumber === number);
        const result: RucLookupResult = { ruc: number, source: match ? 'CLIENTE' : 'NO_ENCONTRADO', clientId: match?.id ?? null,
          legalName: match?.displayName ?? null, address: null, status: null, condition: null, externalConfigured: this.canLookup(), message: null };
        if (match) this.loadExisting(match.id, result);
        else this.found.set(result);
      },
      error: () => {
        this.lookingUp.set(false);
        this.lookedUp = '';
      },
    });
  }

  sourceText(result: RucLookupResult): string {
    if (result.source === 'CLIENTE') return 'Este cliente ya se encuentra registrado: se usarán sus datos.';
    if (result.source === 'SUNAT') return `Datos obtenidos de SUNAT.${result.message ? ` ${result.message}` : ''}`;
    if (!this.isRuc()) return 'Cliente nuevo: completa los datos.';
    if (!result.externalConfigured) return 'Consulta a SUNAT no activa: completa los datos.';
    return result.message ?? 'No se encontró en SUNAT: completa los datos.';
  }

  private loadExisting(clientId: string, result: RucLookupResult): void {
    this.lookingUp.set(true);
    this.api.get(clientId).subscribe({
      next: (detail) => {
        this.lookingUp.set(false);
        if (this.form.controls.documentNumber.value.trim() !== result.ruc) return;
        this.existing.set(detail);
        this.found.set(result);
        this.fill({ displayName: detail.displayName, phone: detail.phone ?? '', email: detail.email ?? '', address: detail.address ?? '' });
        for (const control of this.editableControls()) control.disable({ emitEvent: false });
      },
      error: () => {
        this.lookingUp.set(false);
        this.found.set({ ...result, source: 'NO_ENCONTRADO' });
      },
    });
  }

  private fill(values: Partial<Record<'displayName' | 'phone' | 'email' | 'address', string>>): void {
    this.form.patchValue(values, { emitEvent: false });
    this.autoFilled = true;
  }

  private editableControls() {
    const controls = this.form.controls;
    return [controls.displayName, controls.phone, controls.email, controls.address];
  }

  private clearLookup(): void {
    this.found.set(null);
    this.lookedUp = '';
    if (this.existing()) {
      this.existing.set(null);
      for (const control of this.editableControls()) control.enable({ emitEvent: false });
    }
    if (this.autoFilled) {
      this.form.patchValue({ displayName: '', phone: '', email: '', address: '' }, { emitEvent: false });
      this.autoFilled = false;
    }
  }

  save(): void {
    const existing = this.existing();
    if (existing) {
      this.dialogRef.close(toCustomer(existing));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({
        displayName: value.displayName.trim(),
        firstName: null,
        lastName: null,
        documentType: value.documentType,
        documentNumber: value.documentNumber.trim(),
        email: value.email.trim() || null,
        phone: value.phone.trim(),
        address: value.address.trim() || null,
        notes: null,
        isActive: true,
      })
      .subscribe({
        next: (detail) => this.dialogRef.close(toCustomer(detail)),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(
            cause instanceof AppHttpError && cause.status === 409
              ? 'Ya existe un cliente con ese documento.'
              : 'No se pudo registrar el cliente.',
          );
        },
      });
  }
}

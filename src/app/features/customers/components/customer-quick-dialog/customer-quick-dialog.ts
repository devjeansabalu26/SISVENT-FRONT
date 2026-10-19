import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { applyDocumentType, defaultDocumentType, documentOptions } from '../../../../core/regional/document-types';
import { RegionalService } from '../../../../core/regional/regional.service';
import { CustomerApiService } from '../../data-access/customer-api.service';
import { Customer } from '../../models/customer.model';
import { toCustomer } from '../../utils/to-customer';

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
          <input formControlName="documentNumber" [placeholder]="selectedType()?.placeholder ?? ''" />
          @if (form.controls.documentNumber.touched && form.controls.documentNumber.invalid) {
            <small class="hint">Ingresa un {{ selectedType()?.name ?? 'documento' }} válido@if (selectedType()?.placeholder) {, por ejemplo {{ selectedType()?.placeholder }}}.</small>
          }
        </label>
        <label class="wide"
          >Nombre o razón social *
          <input formControlName="displayName" />
          @if (form.controls.displayName.touched && form.controls.displayName.invalid) {
            <small class="hint">El nombre es obligatorio.</small>
          }
        </label>
        <label
          >Teléfono *
          <input formControlName="phone" inputmode="tel" />
          @if (form.controls.phone.touched && form.controls.phone.invalid) {
            <small class="hint">El teléfono es obligatorio.</small>
          }
        </label>
        <label
          >Correo
          <input formControlName="email" type="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <small class="hint">Correo no válido.</small>
          }
        </label>
      </div>

      @if (error()) {
        <p class="hint">{{ error() }}</p>
      }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="saving()">Guardar cliente</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerQuickDialog {
  private readonly api = inject(CustomerApiService);
  private readonly dialogRef = inject(MatDialogRef<CustomerQuickDialog, Customer | undefined>);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    documentType: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
  });

  private readonly regional = inject(RegionalService);
  private readonly documentType = toSignal(this.form.controls.documentType.valueChanges, {
    initialValue: this.form.controls.documentType.value,
  });
  readonly documentTypes = computed(() => documentOptions(this.regional.documentTypes(), null));
  readonly selectedType = computed(() => this.documentTypes().find((type) => type.code === this.documentType()));

  constructor() {
    this.form.controls.documentType.valueChanges.subscribe(() =>
      applyDocumentType(this.form.controls.documentNumber, this.selectedType()),
    );
    void this.regional.loadDocumentTypes().then((types) => {
      this.form.controls.documentType.setValue(defaultDocumentType(types));
      applyDocumentType(this.form.controls.documentNumber, this.selectedType());
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
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
        address: null,
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

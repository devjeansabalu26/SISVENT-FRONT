import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { CustomerApiService } from '../../data-access/customer-api.service';
import { Customer } from '../../models/customer.model';
import { toCustomer } from '../../utils/to-customer';

/**
 * Figma `mod-crear-cliente`: alta compacta de cliente sin salir de la pantalla (p. ej. desde el POS).
 * Usa el mismo endpoint y validaciones que `customer-form-page`; se cierra con el cliente creado.
 */
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
            <option>DNI</option>
            <option>RUC</option>
            <option>CE</option>
          </select>
        </label>
        <label
          >Número de documento *
          <input formControlName="documentNumber" inputmode="numeric" />
          @if (form.controls.documentNumber.touched && form.controls.documentNumber.invalid) {
            <small class="hint">Ingresa un documento válido (8 a 11 dígitos).</small>
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
    documentNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8,11}$/)],
    }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
  });

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

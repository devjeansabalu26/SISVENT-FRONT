import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { CustomerApiService } from '../../data-access/customer-api.service';
import { Customer, CustomerDetail } from '../../models/customer.model';
import { toCustomer } from '../../utils/to-customer';

export interface CustomerEditDialogData {
  readonly customerId: string;
}

@Component({
  selector: 'app-customer-edit-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="save()">
      <header>
        <span class="material-icons">edit</span>
        <div>
          <h2>Editar cliente</h2>
          <p>{{ detail() ? (detail()!.documentType ?? 'Documento') + ' ' + (detail()!.documentNumber ?? '') : 'Cargando datos del cliente…' }}</p>
        </div>
      </header>

      <div class="fields two">
        <label class="wide">Nombre o razón social *
          <input formControlName="displayName" />
          <small class="help" data-kind="error">{{ form.controls.displayName.touched && form.controls.displayName.invalid ? 'El nombre es obligatorio.' : '' }}</small>
        </label>
        <label>Teléfono
          <input formControlName="phone" inputmode="tel" />
          <small class="help"></small>
        </label>
        <label>Correo
          <input formControlName="email" type="email" placeholder="nombre@correo.com" />
          <small class="help" data-kind="error">{{ form.controls.email.touched && form.controls.email.invalid ? 'Correo no válido.' : '' }}</small>
        </label>
        <label class="wide">Dirección
          <input formControlName="address" maxlength="350" />
          <small class="help"></small>
        </label>
      </div>

      @if (error()) {
        <p class="hint">{{ error() }}</p>
      }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="saving() || !detail()">{{ saving() ? 'Guardando…' : 'Guardar cambios' }}</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .help { display: block; min-height: 18px; line-height: 18px; color: var(--color-text-muted); font-size: 12px; font-weight: 500; }
    .help[data-kind='error'] { color: var(--color-danger); }
    label { align-content: start; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerEditDialog implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly dialogRef = inject(MatDialogRef<CustomerEditDialog, Customer | undefined>);
  private readonly data = inject<CustomerEditDialogData>(MAT_DIALOG_DATA);

  readonly detail = signal<CustomerDetail | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(220)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(40)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(254)] }),
    address: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.api.get(this.data.customerId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.form.setValue({
          displayName: detail.displayName,
          phone: detail.phone ?? '',
          email: detail.email ?? '',
          address: detail.address ?? '',
        });
      },
      error: () => this.error.set('No se pudieron cargar los datos del cliente.'),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const detail = this.detail();
    if (!detail || this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .update(detail.id, {
        displayName: value.displayName.trim(),
        firstName: detail.firstName,
        lastName: detail.lastName,
        documentType: detail.documentType,
        documentNumber: detail.documentNumber,
        email: value.email.trim() || null,
        phone: value.phone.trim() || null,
        address: value.address.trim() || null,
        notes: detail.notes,
        isActive: detail.isActive,
        version: detail.version,
      })
      .subscribe({
        next: (updated) => this.dialogRef.close(toCustomer(updated)),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(
            cause instanceof AppHttpError && cause.status === 409
              ? 'Alguien más cambió este cliente. Cierra y vuelve a abrir para ver sus datos actuales.'
              : cause instanceof AppHttpError && cause.status === 403
                ? 'Tu usuario no tiene permiso para editar clientes.'
                : 'No se pudieron guardar los cambios del cliente.',
          );
        },
      });
  }
}

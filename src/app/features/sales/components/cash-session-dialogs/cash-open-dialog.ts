import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CashSession, CashSessionApiService, cashErrorMessage } from '../../data-access/cash-session-api.service';

export interface CashOpenData {
  readonly storeId: string;
  readonly storeName: string;
  readonly pendingSales: number;
}

@Component({
  selector: 'app-cash-open-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">lock_open</span>
        <div>
          <h2>Abrir caja</h2>
          <p>{{ data.storeName }}</p>
        </div>
      </header>

      <div class="fields">
        <label class="wide"
          ><span>Monto inicial en caja (S/) <span class="required">*</span></span>
          <input type="number" min="0" step="0.10" formControlName="amount" placeholder="Escribe el efectivo con el que abres (ej. 100.00)"
            [class.invalid]="showError()" />
          @if (showError()) {
            <small class="hint">
              @if (amount.hasError('required')) { Ingresa el monto inicial de la caja. }
              @else if (amount.hasError('min')) { El monto no puede ser negativo. }
              @else { El monto excede el máximo permitido. }
            </small>
          }
        </label>
        @if (data.pendingSales > 0) {
          <p class="muted">
            {{ data.pendingSales }} {{ data.pendingSales === 1 ? 'venta hecha' : 'ventas hechas' }} con la caja cerrada
            {{ data.pendingSales === 1 ? 'se asignará' : 'se asignarán' }} a este turno.
          </p>
        }
      </div>

      @if (error()) { <p class="hint" role="alert">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="amount.invalid || saving()">{{ saving() ? 'Abriendo…' : 'Abrir caja' }}</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashOpenDialog {
  readonly data = inject<CashOpenData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CashOpenDialog, CashSession>);
  private readonly api = inject(CashSessionApiService);

  readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(99999999.99)]),
  });
  readonly amount = this.form.controls.amount;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  showError(): boolean {
    return (this.amount.touched || this.amount.dirty) && this.amount.invalid;
  }

  confirm(): void {
    if (this.amount.invalid || this.saving()) {
      this.amount.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.open({ storeId: this.data.storeId, openingAmount: this.amount.value ?? 0 }).subscribe({
      next: (session) => this.dialogRef.close(session),
      error: (cause: unknown) => {
        this.saving.set(false);
        this.error.set(cashErrorMessage(cause, 'No se pudo abrir la caja.'));
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

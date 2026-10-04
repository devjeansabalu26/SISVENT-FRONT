import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CashSession, CashSessionApiService, cashErrorMessage } from '../../data-access/cash-session-api.service';

export interface CashSessionCloseData {
  readonly session: CashSession;
  readonly forced: boolean;
}

function trimmedMinLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && String(control.value).trim().length < min ? { minlength: true } : null;
}

@Component({
  selector: 'app-cash-session-close-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">{{ data.forced ? 'gpp_maybe' : 'point_of_sale' }}</span>
        <div>
          <h2>{{ data.forced ? 'Forzar cierre de caja' : 'Cerrar caja' }}</h2>
          <p>{{ s.storeName }} · abierta por {{ s.openedBy }}</p>
        </div>
      </header>

      <dl class="expected">
        <div><dt>Fondo inicial</dt><dd>S/ {{ s.openingAmount.toFixed(2) }}</dd></div>
        <div><dt>{{ s.salesCount }} {{ s.salesCount === 1 ? 'venta' : 'ventas' }} del turno</dt><dd>S/ {{ s.totalSales.toFixed(2) }}</dd></div>
        @for (method of s.byMethod; track method.code) {
          <div><dt>— {{ method.name }}</dt><dd>S/ {{ method.amount.toFixed(2) }}</dd></div>
        }
        @if (s.totalRefunds > 0) {
          <div><dt>Devoluciones (notas de crédito)</dt><dd>- S/ {{ s.totalRefunds.toFixed(2) }}</dd></div>
        }
        <div class="strong"><dt>Efectivo esperado en caja</dt><dd>S/ {{ s.expectedCash.toFixed(2) }}</dd></div>
      </dl>

      <div class="fields">
        <label class="wide"
          ><span>Efectivo contado en caja (S/) <span class="required">*</span></span>
          <input type="number" min="0" step="0.10" formControlName="countedCash" placeholder="Escribe el efectivo que hay en caja"
            [class.invalid]="showError('countedCash')" />
          @if (showError('countedCash')) {
            <small class="hint">
              @if (form.controls.countedCash.hasError('required')) { Ingresa el efectivo contado. }
              @else if (form.controls.countedCash.hasError('min')) { El monto no puede ser negativo. }
              @else { El monto excede el máximo permitido. }
            </small>
          }
        </label>
        @if (difference() !== null) {
          <p class="difference" [class.difference--ok]="difference() === 0">
            Diferencia: S/ {{ difference()!.toFixed(2) }}
            {{ difference() === 0 ? '· Cuadra' : difference()! > 0 ? '· Sobrante' : '· Faltante' }}
          </p>
        }
        @if (data.forced) {
          <label class="wide"
            ><span>Motivo del cierre forzado <span class="required">*</span></span>
            <textarea formControlName="reason" maxlength="500" placeholder="Escribe por qué cierras la caja de otro usuario…"
              [class.invalid]="showError('reason')"></textarea>
            @if (showError('reason')) { <small class="hint">Describe el motivo (mínimo 5 caracteres).</small> }
          </label>
        }
        <label class="wide"
          ><span>Observaciones</span>
          <textarea formControlName="notes" maxlength="500" placeholder="Escribe si hubo algún descuadre o novedad…"></textarea>
        </label>
      </div>

      @if (error()) { <p class="hint" role="alert">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Cerrando…' : data.forced ? 'Forzar cierre' : 'Cerrar caja' }}
        </button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../cash-close-dialog/cash-close-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashSessionCloseDialog {
  readonly data = inject<CashSessionCloseData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CashSessionCloseDialog, CashSession>);
  private readonly api = inject(CashSessionApiService);
  readonly s = this.data.session;

  readonly form = new FormGroup({
    countedCash: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(99999999.99)]),
    reason: new FormControl('', {
      nonNullable: true,
      validators: this.data.forced ? [Validators.required, trimmedMinLength(5), Validators.maxLength(500)] : [],
    }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  private readonly counted = toSignal(this.form.controls.countedCash.valueChanges, { initialValue: null });
  readonly difference = computed(() => {
    const value = this.counted();
    return value === null || value === undefined || Number.isNaN(value)
      ? null
      : Math.round((value - this.s.expectedCash) * 100) / 100;
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  showError(name: 'countedCash' | 'reason'): boolean {
    const control = this.form.controls[name];
    return (control.touched || control.dirty) && control.invalid;
  }

  confirm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .close(this.s.id, {
        countedCash: value.countedCash ?? 0,
        notes: value.notes.trim() || null,
        reason: this.data.forced ? value.reason.trim() : null,
      })
      .subscribe({
        next: (session) => this.dialogRef.close(session),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(cashErrorMessage(cause, 'No se pudo cerrar la caja.'));
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

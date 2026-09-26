import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ShortDatePipe } from '../../../../shared/pipes/date-time.pipe';

export interface ValidityChangeData {
  readonly companyName: string;
  /** Fecha de fin vigente, `yyyy-MM-dd`. */
  readonly currentEnd: string;
}

export interface ValidityChangeResult {
  readonly endDate: string;
  readonly reason: string;
}

const DAY_MS = 86_400_000;

/** Diferencia en días entre dos fechas `yyyy-MM-dd` (sin zona horaria: ambas se leen como UTC). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** Figma `mod-cambiar-vigencia` (MOD-SA-03): nueva fecha de vencimiento con motivo obligatorio. */
@Component({
  selector: 'app-validity-change-dialog',
  imports: [MatDialogModule, ReactiveFormsModule, ShortDatePipe],
  template: `
    <form class="dialog review" [formGroup]="form" (ngSubmit)="confirm()">
      <header>
        <span class="material-icons">event</span>
        <div class="review__title"><h2>Cambiar vigencia</h2></div>
        <small class="review__code">MOD-SA-03</small>
      </header>

      <dl class="review__meta">
        <div><dt>Empresa</dt><dd>{{ data.companyName }}</dd></div>
        <div><dt>Fecha anterior</dt><dd>{{ data.currentEnd | shortDate }}</dd></div>
      </dl>

      <div class="fields">
        <label class="wide"
          >Nueva fecha de vencimiento *
          <input type="date" formControlName="endDate" />
          @if (form.controls.endDate.touched && form.controls.endDate.invalid) {
            <small class="hint">Elige una fecha distinta a la actual.</small>
          }
        </label>

        @if (difference() !== null) {
          <p class="review__banner" [attr.data-tone]="difference()! > 0 ? 'success' : 'warning'">
            <span class="material-icons">{{ difference()! > 0 ? 'trending_up' : 'trending_down' }}</span>
            {{ difference()! > 0 ? 'Ampliación' : 'Reducción' }} de vigencia:
            <strong>{{ difference()! > 0 ? '+' : '' }}{{ difference() }} días</strong>
          </p>
        }

        <label class="wide"
          >Motivo / Observación *
          <textarea formControlName="reason" placeholder="Prórroga solicitada por el cliente…"></textarea>
          @if (form.controls.reason.touched && form.controls.reason.invalid) {
            <small class="hint">Describe el motivo (mínimo 5 caracteres).</small>
          }
        </label>
      </div>

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary">Confirmar cambio</button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidityChangeDialog {
  readonly data = inject<ValidityChangeData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ValidityChangeDialog, ValidityChangeResult | undefined>);

  readonly form = new FormGroup({
    endDate: new FormControl(this.data.currentEnd, {
      nonNullable: true,
      validators: [Validators.required, (control: AbstractControl): ValidationErrors | null =>
        control.value === this.data.currentEnd ? { unchanged: true } : null],
    }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  private readonly endDate = toSignal(this.form.controls.endDate.valueChanges, { initialValue: this.data.currentEnd });
  readonly difference = computed(() => {
    const end = this.endDate();
    return end && end !== this.data.currentEnd ? daysBetween(this.data.currentEnd, end) : null;
  });

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({ endDate: value.endDate, reason: value.reason.trim() });
  }
}

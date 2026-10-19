import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { AttendanceApiService, attendanceErrorMessage } from '../../data-access/attendance-api.service';
import { AttendancePerson, ROLE_LABELS, hourOf } from '../../models/attendance.model';
import { LocalTimePipe } from '../../../../shared/pipes/date-time.pipe';

export interface AttendanceMarkDialogData {
  readonly storeId: string | null;
  readonly storeName: string | null;
  readonly present: readonly AttendancePerson[];
  readonly message?: string;
}

@Component({
  selector: 'app-attendance-mark-dialog',
  imports: [MatDialogModule, ReactiveFormsModule, LocalTimePipe],
  template: `
    <form class="dialog" (submit)="$event.preventDefault(); mark()">
      <header>
        <span class="material-icons">how_to_reg</span>
        <div>
          <h2>Marcar asistencia</h2>
          <p>{{ data.storeName ?? 'Tu local' }} · escribe tu usuario y marca tu entrada</p>
        </div>
      </header>

      @if (present().length) {
        <div class="present">
          <span class="present__title">En turno ahora</span>
          @for (person of present(); track person.recordId) {
            <div class="present__row">
              <span class="material-icons">person</span>
              <strong>{{ person.fullName }}</strong>
              <small>{{ roleLabel(person.role) }} · desde {{ person.checkInAt | localTime }}</small>
            </div>
          }
        </div>
      } @else {
        <p class="alert">
          <span class="material-icons">info</span>
          {{ data.message ?? 'Nadie ha marcado asistencia en este local. Marca tu entrada para empezar a vender.' }}
        </p>
      }

      <label>
        <span>Usuario de asistencia <span class="required">*</span></span>
        <input #codeInput type="text" inputmode="numeric" maxlength="5" autocomplete="off" [formControl]="code"
          placeholder="Código de 5 dígitos" [class.invalid]="showError()" (input)="digitsOnly($event)" />
        @if (showError()) { <small class="hint">Ingresa tu usuario de 5 dígitos.</small> }
      </label>

      <footer>
        <button type="button" (click)="close()">{{ present().length ? 'Cerrar' : 'Más tarde' }}</button>
        <button type="submit" class="primary" [disabled]="saving()">
          {{ saving() ? 'Marcando…' : 'Marcar entrada' }}
        </button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .present { display: grid; gap: 6px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .present__title { color: var(--color-text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .present__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; }
    .present__row .material-icons { font-size: 18px; color: var(--color-success); }
    .present__row small { color: var(--color-text-muted); }
    .alert { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; border-radius: var(--radius-md);
      color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface)); font-size: 14px; }
    .alert .material-icons { font-size: 20px; }
    input { font-size: 22px; letter-spacing: 0.3em; text-align: center; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceMarkDialog {
  readonly data = inject<AttendanceMarkDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AttendanceMarkDialog, boolean>);
  private readonly api = inject(AttendanceApiService);
  private readonly notifications = inject(NotificationService);
  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  readonly present = signal<readonly AttendancePerson[]>(this.data.present);
  readonly saving = signal(false);
  private marked = false;
  readonly code = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{5}$/)] });

  constructor() {
    afterNextRender(() => this.codeInput()?.nativeElement.focus());
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  showError(): boolean {
    return this.code.invalid && (this.code.touched || this.code.dirty);
  }

  digitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 5);
    if (clean !== input.value) this.code.setValue(clean);
  }

  mark(): void {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    const already = this.present().find((person) => person.userCode === this.code.value);
    if (already) {
      this.notifications.show(`${already.fullName} ya marcó su entrada a las ${hourOf(already.checkInAt)}.`, 'warning');
      return;
    }
    this.saving.set(true);
    this.api.checkIn(this.code.value, this.data.storeId).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.marked = true;
        this.notifications.show(`Entrada registrada a las ${hourOf(result.record.checkInAt)}: ${result.record.fullName}.`, 'success');
        this.dialogRef.close(true);
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.code.setValue('');
        this.notifications.show(attendanceErrorMessage(cause, 'No se pudo marcar la asistencia.'), 'error');
        this.codeInput()?.nativeElement.focus();
      },
    });
  }

  close(): void {
    this.dialogRef.close(this.marked);
  }
}

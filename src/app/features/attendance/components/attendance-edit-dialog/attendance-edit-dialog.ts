import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AttendanceApiService, attendanceErrorMessage } from '../../data-access/attendance-api.service';
import {
  AttendanceRecord,
  AttendanceStoreOption,
  AttendanceWorker,
  ROLE_LABELS,
  SaveAttendanceBody,
} from '../../models/attendance.model';

export interface AttendanceEditDialogData {
  readonly record: AttendanceRecord | null;
  readonly stores: readonly AttendanceStoreOption[];
  readonly workers: readonly AttendanceWorker[];
  readonly storeId: string | null;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Component({
  selector: 'app-attendance-edit-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  template: `
    <form class="dialog" [formGroup]="form" (ngSubmit)="save()">
      <header>
        <span class="material-icons">{{ data.record ? 'edit_calendar' : 'more_time' }}</span>
        <div>
          <h2>{{ data.record ? 'Corregir asistencia' : 'Registrar asistencia' }}</h2>
          <p>{{ data.record ? 'Modifica las horas, el local o las observaciones' : 'Registro manual hecho por el administrador' }}</p>
        </div>
      </header>

      <div class="fields two">
        <label class="wide">
          <span>Local <span class="required">*</span></span>
          <select formControlName="storeId">
            @for (store of data.stores; track store.id) { <option [value]="store.id">{{ store.name }}</option> }
          </select>
        </label>
        <label class="wide">
          <span>Persona <span class="required">*</span></span>
          <select formControlName="profileId">
            <option value="" disabled>Selecciona a la persona</option>
            @for (worker of workersForStore(); track worker.profileId) {
              <option [value]="worker.profileId">{{ worker.fullName }} · {{ roleLabel(worker.role) }}{{ worker.userCode ? ' · ' + worker.userCode : '' }}</option>
            }
          </select>
        </label>
        <label>
          <span>Fecha <span class="required">*</span></span>
          <input type="date" formControlName="date" />
        </label>
        <label>
          <span>Hora de entrada <span class="required">*</span></span>
          <input type="time" formControlName="checkIn" />
        </label>
        <label>
          Hora de salida
          <input type="time" formControlName="checkOut" />
          <small class="muted">Vacío = sigue en turno.</small>
        </label>
        <label class="check">
          <input type="checkbox" formControlName="nextDay" /> La salida fue al día siguiente
        </label>
        <label class="wide">
          Observaciones
          <textarea formControlName="notes" rows="2" maxlength="300" placeholder="Motivo de la corrección o detalle"></textarea>
        </label>
      </div>

      @if (error()) { <p class="hint">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
      </footer>
    </form>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceEditDialog {
  readonly data = inject<AttendanceEditDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AttendanceEditDialog, AttendanceRecord>);
  private readonly api = inject(AttendanceApiService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private readonly record = this.data.record;
  private readonly checkInDate = this.record ? new Date(this.record.checkInAt) : new Date();
  private readonly checkOutDate = this.record?.checkOutAt ? new Date(this.record.checkOutAt) : null;

  readonly form = new FormGroup({
    storeId: new FormControl(this.record?.storeId ?? this.data.storeId ?? this.data.stores[0]?.id ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    profileId: new FormControl(this.record?.profileId ?? '', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(localDate(this.checkInDate), { nonNullable: true, validators: [Validators.required] }),
    checkIn: new FormControl(localTime(this.checkInDate), { nonNullable: true, validators: [Validators.required] }),
    checkOut: new FormControl(this.checkOutDate ? localTime(this.checkOutDate) : '', { nonNullable: true }),
    nextDay: new FormControl(!!this.checkOutDate && localDate(this.checkOutDate) !== localDate(this.checkInDate), { nonNullable: true }),
    notes: new FormControl(this.record?.notes ?? '', { nonNullable: true }),
  });

  private readonly storeId = toSignal(this.form.controls.storeId.valueChanges, { initialValue: this.form.controls.storeId.value });
  readonly workersForStore = computed(() =>
    this.data.workers.filter((worker) => worker.role === 'ADMIN' || worker.storeId === this.storeId()),
  );

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa el local, la persona, la fecha y la hora de entrada.');
      return;
    }
    const value = this.form.getRawValue();
    const checkIn = new Date(`${value.date}T${value.checkIn}`);
    let checkOut: Date | null = null;
    if (value.checkOut) {
      checkOut = new Date(`${value.date}T${value.checkOut}`);
      if (value.nextDay) checkOut.setDate(checkOut.getDate() + 1);
      if (checkOut < checkIn) {
        this.error.set('La salida debe ser posterior a la entrada.');
        return;
      }
    }
    const body: SaveAttendanceBody = {
      profileId: value.profileId,
      storeId: value.storeId,
      checkInAt: checkIn.toISOString(),
      checkOutAt: checkOut?.toISOString() ?? null,
      notes: value.notes.trim() || null,
      version: this.record?.version,
    };
    this.saving.set(true);
    this.error.set(null);
    const request = this.record ? this.api.update(this.record.id, body) : this.api.create(body);
    request.subscribe({
      next: (record) => {
        this.saving.set(false);
        this.dialogRef.close(record);
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.error.set(attendanceErrorMessage(cause, 'No se pudo guardar la asistencia.'));
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

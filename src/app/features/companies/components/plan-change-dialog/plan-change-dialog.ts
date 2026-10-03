import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PlanApiService } from '../../../plans/data-access/plan-api.service';
import { Plan } from '../../../plans/models/plan.model';

// La fecha de fin no puede ser anterior a la de inicio (misma regla que valida el backend).
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const { startDate, endDate } = group.value as { startDate?: string; endDate?: string };
  return startDate && endDate && endDate < startDate ? { endBeforeStart: true } : null;
}

// Evita motivos con solo espacios: el backend exige 5 caracteres reales.
function trimmedMinLength(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && String(control.value).trim().length < min ? { minlength: true } : null;
}

export interface PlanChangeData {
  readonly companyName: string;
  readonly currentPlan: string;
}

export interface PlanChangeResult {
  readonly planId: string;
  readonly contractedPrice: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
}

@Component({
  selector: 'app-plan-change-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './plan-change-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanChangeDialog implements OnInit {
  readonly data = inject<PlanChangeData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanChangeDialog, PlanChangeResult | undefined>);
  private readonly planApi = inject(PlanApiService);

  readonly plans = signal<readonly Plan[]>([]);

  readonly form = new FormGroup(
    {
      planId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      contractedPrice: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0), Validators.max(99999999.99)],
      }),
      startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      reason: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, trimmedMinLength(5), Validators.maxLength(500)],
      }),
    },
    { validators: endAfterStart },
  );

  /** Marca en rojo un campo inválido una vez que el usuario lo tocó o lo modificó. */
  showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    const touched = control.touched || control.dirty;
    if (name === 'endDate' && touched && this.form.hasError('endBeforeStart')) return true;
    return touched && control.invalid;
  }

  ngOnInit(): void {
    this.planApi.list().subscribe((plans) => {
      this.plans.set(plans);
      const first = plans[0];
      if (first) {
        this.form.controls.planId.setValue(first.id);
        this.form.controls.contractedPrice.setValue(first.currentPrice ?? 0);
      }
    });
    // Al elegir otro plan se sugiere su precio vigente (se puede editar).
    this.form.controls.planId.valueChanges.subscribe((id) => {
      const plan = this.plans().find((p) => p.id === id);
      if (plan?.currentPrice != null) this.form.controls.contractedPrice.setValue(plan.currentPrice);
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({ ...value, contractedPrice: value.contractedPrice ?? 0, reason: value.reason.trim() });
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface PlanChangeData {
  readonly companyName: string;
  readonly currentPlan: string;
}

export interface PlanChangeResult {
  readonly newPlan: string;
  readonly effectiveDate: string;
  readonly reason: string;
}

@Component({
  selector: 'app-plan-change-dialog',
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './plan-change-dialog.html',
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanChangeDialog {
  readonly data = inject<PlanChangeData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanChangeDialog, PlanChangeResult | undefined>);

  readonly plans = ['Plan Esencial (S/ 40.00)', 'Plan Negocio (S/ 60.00)', 'Plan Profesional (S/ 120.00)'];

  readonly form = new FormGroup({
    newPlan: new FormControl(this.plans[2], { nonNullable: true, validators: [Validators.required] }),
    effectiveDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}

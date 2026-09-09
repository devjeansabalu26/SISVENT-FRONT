import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

type LineGroup = FormGroup<{
  productName: FormControl<string>;
  sku: FormControl<string>;
  quantity: FormControl<number>;
  unitCost: FormControl<number>;
}>;

@Component({
  selector: 'app-goods-receipt-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './goods-receipt-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './goods-receipt-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly form = new FormGroup({
    date: new FormControl(new Date().toLocaleDateString('es-PE'), { nonNullable: true, validators: [Validators.required] }),
    warehouse: new FormControl('Tienda Principal', { nonNullable: true, validators: [Validators.required] }),
    supplier: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentType: new FormControl('Factura', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    lines: new FormArray<LineGroup>([]),
  });

  private readonly linesVersion = signal(0);

  readonly totals = computed(() => {
    this.linesVersion();
    const lines = this.form.controls.lines.controls;
    const units = lines.reduce((sum, line) => sum + (line.controls.quantity.value || 0), 0);
    const cost = lines.reduce(
      (sum, line) => sum + (line.controls.quantity.value || 0) * (line.controls.unitCost.value || 0),
      0,
    );
    return { count: lines.length, units, cost };
  });

  constructor() {
    this.addLine();
  }

  get lines(): FormArray<LineGroup> {
    return this.form.controls.lines;
  }

  addLine(): void {
    this.lines.push(
      new FormGroup({
        productName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        sku: new FormControl('', { nonNullable: true }),
        quantity: new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] }),
        unitCost: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      }),
    );
    this.linesVersion.update((value) => value + 1);
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
    this.linesVersion.update((value) => value + 1);
  }

  recalc(): void {
    this.linesVersion.update((value) => value + 1);
  }

  save(): void {
    if (this.form.invalid || this.lines.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show('Ingreso de mercadería registrado correctamente.', 'success');
    void this.router.navigateByUrl('/app/goods-receipts');
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { ReviewDialogData } from '../../../shared/ui/review-dialog/review-dialog.model';
import { formatSoles } from '../../../shared/utils/diff-rows';
import { StoreApiService } from '../../locales/data-access/store-api.service';
import { ProductApiService } from '../../products/data-access/product-api.service';
import { SupplierApiService } from '../../suppliers/data-access/supplier-api.service';
import { GoodsReceiptApiService } from '../data-access/goods-receipt-api.service';
import { GoodsReceiptLineInput } from '../models/goods-receipt.model';

type LineGroup = FormGroup<{
  productId: FormControl<string>;
  quantity: FormControl<number>;
  unitCost: FormControl<number>;
}>;

@Component({
  selector: 'app-goods-receipt-form-page',
  imports: [ReactiveFormsModule, PageHeader],
  templateUrl: './goods-receipt-form-page.html',
  styleUrls: ['../../../shared/forms/form-page.scss', './goods-receipt-form-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptFormPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(GoodsReceiptApiService);
  private readonly storeApi = inject(StoreApiService);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly saving = signal(false);
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly suppliers = signal<readonly { id: string; businessName: string }[]>([]);
  readonly products = signal<readonly { id: string; sku: string; name: string }[]>([]);

  readonly form = new FormGroup({
    storeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    supplierId: new FormControl('', { nonNullable: true }),
    documentType: new FormControl('Factura', { nonNullable: true }),
    documentNumber: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    updateReferenceCost: new FormControl(true, { nonNullable: true }),
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

  ngOnInit(): void {
    this.storeApi.list().subscribe((response) => {
      this.stores.set(response.items);
      if (response.items.length === 1) this.form.controls.storeId.setValue(response.items[0].id);
    });
    this.supplierApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.suppliers.set(page.items));
    this.productApi.list({ pageSize: 100, isActive: true }).subscribe((page) => this.products.set(page.items));
    this.addLine();
  }

  get lines(): FormArray<LineGroup> {
    return this.form.controls.lines;
  }

  addLine(): void {
    this.lines.push(
      new FormGroup({
        productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
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

  cancel(): void {
    if (!this.form.dirty) {
      void this.router.navigateByUrl('/app/goods-receipts');
      return;
    }
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Cancelar ingreso',
          message:
            '¿Está seguro de que desea cancelar el ingreso de esta mercadería? Se perderán todos los datos cargados y el progreso de este formulario. El stock en inventario no sufrirá ninguna modificación.',
          cancelLabel: 'No, regresar',
          confirmLabel: 'Sí, cancelar',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => void this.router.navigateByUrl('/app/goods-receipts'));
  }

  save(): void {
    if (this.form.invalid || this.lines.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const totals = this.totals();
    const document = [value.documentType.trim(), value.documentNumber.trim()].filter(Boolean).join(' ');
    this.dialog
      .open<ReviewDialog, ReviewDialogData, boolean>(ReviewDialog, {
        data: {
          title: 'Confirmar ingreso',
          code: 'MOD-PR-01',
          icon: 'local_shipping',
          meta: [
            { label: 'Proveedor', value: this.suppliers().find((s) => s.id === value.supplierId)?.businessName ?? 'Sin proveedor' },
            { label: 'Local destino', value: this.stores().find((s) => s.id === value.storeId)?.name ?? '—' },
            { label: 'Documento', value: document || 'Sin documento' },
          ],
          kpis: [
            { label: 'Productos', value: `${totals.count} items` },
            { label: 'Unidades', value: `${totals.units} unids.` },
            { label: 'Costo total', value: formatSoles(totals.cost) },
          ],
          banner: {
            tone: 'warning',
            text: 'Al confirmar, se incrementará de manera inmediata el stock físico en el inventario. Esta acción no se puede deshacer de forma automática.',
          },
          confirmLabel: 'Confirmar ingreso',
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.register());
  }

  private register(): void {
    const value = this.form.getRawValue();
    const lines: readonly GoodsReceiptLineInput[] = value.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitCost: line.unitCost,
    }));
    this.saving.set(true);
    this.api
      .create({
        storeId: value.storeId || null,
        supplierId: value.supplierId || null,
        documentType: value.documentType.trim() || null,
        documentNumber: value.documentNumber.trim() || null,
        receiptDate: null,
        notes: value.notes.trim() || null,
        updateReferenceCost: value.updateReferenceCost,
        lines,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.show('Ingreso de mercadería registrado correctamente.', 'success');
          void this.router.navigateByUrl('/app/goods-receipts');
        },
        error: (cause: unknown) => {
          this.saving.set(false);
          const message =
            cause instanceof AppHttpError && cause.status === 409
              ? 'Conflicto: revisa el proveedor y los productos seleccionados.'
              : 'No se pudo registrar el ingreso.';
          this.notifications.show(message, 'error');
        },
      });
  }
}

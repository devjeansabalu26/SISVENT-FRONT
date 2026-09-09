import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { PRODUCT_MOCK } from '../data-access/product.mock';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './product-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly existing = PRODUCT_MOCK.find(
    (item) => item.id === inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );

  readonly isEdit = !!this.existing;

  readonly form = new FormGroup({
    name: new FormControl(this.existing?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    sku: new FormControl(this.existing?.sku ?? '', { nonNullable: true, validators: [Validators.required] }),
    barcode: new FormControl('', { nonNullable: true }),
    category: new FormControl(this.existing?.category ?? '', { nonNullable: true, validators: [Validators.required] }),
    brand: new FormControl(this.existing?.brand ?? '', { nonNullable: true }),
    purchasePrice: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    salePrice: new FormControl(this.existing?.price ?? 0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    stock: new FormControl(this.existing?.stock ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    minimumStock: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    active: new FormControl(this.existing ? this.existing.status === 'ACTIVE' : true, { nonNullable: true }),
  });

  get margin(): number {
    const buy = this.form.controls.purchasePrice.value;
    const sell = this.form.controls.salePrice.value;
    return sell > 0 ? Math.round(((sell - buy) / sell) * 100) : 0;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show(`Producto ${this.isEdit ? 'actualizado' : 'guardado'} correctamente.`, 'success');
    void this.router.navigateByUrl('/app/products');
  }
}

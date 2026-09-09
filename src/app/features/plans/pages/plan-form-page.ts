import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { PLAN_MOCK } from '../data-access/plan.mock';

const PLAN_MODULES = [
  'Registro de ventas',
  'Gestión de clientes',
  'Historial de transacciones',
  'Mantenimiento de productos',
  'Categorías y marcas',
  'Control de stock',
  'Reportes y analítica',
  'Rendimiento de vendedores',
  'Módulo de proveedores',
  'Ingreso e historial de mercadería',
  'Auditoría completa de procesos',
] as const;

@Component({
  selector: 'app-plan-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './plan-form-page.html',
  styleUrl: '../../../shared/forms/form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanFormPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly existing = PLAN_MOCK.find(
    (item) => item.id === inject(ActivatedRoute).snapshot.paramMap.get('id'),
  );

  readonly isEdit = !!this.existing;
  readonly moduleNames = PLAN_MODULES;

  readonly form = new FormGroup({
    code: new FormControl(this.existing?.code ?? '', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl(this.existing?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(this.existing?.status !== 'INACTIVE', { nonNullable: true }),
    price: new FormControl(this.existing?.price ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    billing: new FormControl('Mensual', { nonNullable: true }),
    sellerLimit: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    localLimit: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    unlimitedProducts: new FormControl(true, { nonNullable: true }),
    productLimit: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    modules: new FormArray(PLAN_MODULES.map(() => new FormControl(false, { nonNullable: true }))),
  });

  get modules(): FormArray {
    return this.form.controls.modules;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.notifications.show(`Plan ${this.isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
    void this.router.navigateByUrl('/app/plans');
  }
}

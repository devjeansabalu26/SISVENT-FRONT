import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { MoneyPipe } from '../../../../shared/pipes/date-time.pipe';
import { AccessControlService } from '../../../../core/auth/services/access-control.service';
import { PLAN_FEATURES } from '../../../../core/auth/constants/plan-features.constant';
import { APP_PERMISSIONS } from '../../../../core/auth/constants/app-permission.constant';
import { WholesalePrice, WholesalePriceApiService, wholesaleTotal } from '../../data-access/wholesale-price-api.service';

@Component({
  selector: 'app-product-wholesale-offers',
  imports: [ReactiveFormsModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enabled()) {
      <div class="wholesale">
        <h3>Precio por mayor</h3>
        @if (!productId()) {
          <p class="muted">Guarda el producto para agregarle ofertas por mayor. También se crean solas al vender por mayor en el punto de venta.</p>
        } @else {
          @if (offers().length) {
            <ul class="offers">
              @for (offer of offers(); track offer.id) {
                <li>
                  <span><strong>{{ offer.quantity }} u.</strong> a <strong>{{ offer.price | money }} c/u</strong>
                    <small>(total {{ total(offer.quantity, offer.price) | money }})</small></span>
                  @if (canEdit) {
                    <button type="button" class="remove" (click)="remove(offer)" [disabled]="busy()" title="Eliminar oferta" [attr.aria-label]="'Eliminar la oferta de ' + offer.quantity + ' unidades'">
                      <span class="material-icons">delete_outline</span>
                    </button>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="muted">Sin ofertas por mayor. Agrega la cantidad y el precio por unidad; en el punto de venta el total se calcula solo.</p>
          }
          @if (canEdit) {
          <form class="add" [formGroup]="form" (ngSubmit)="add()">
            <label>Cantidad
              <input type="number" min="0.001" step="any" formControlName="quantity" placeholder="Ej. 12" />
            </label>
            <label>Precio por mayor (c/u)
              <input type="number" min="0.01" step="0.01" formControlName="price" placeholder="Ej. 2.50" />
            </label>
            <button type="submit" [disabled]="busy()">Agregar oferta</button>
          </form>
          }
        }
      </div>
    }
  `,
  styles: `
    .wholesale { display: grid; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border); }
    h3 { margin: 0; font-size: 15px; }
    .muted { margin: 0; color: var(--color-text-muted); font-size: 14px; }
    .offers { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
    .offers li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .offers small { color: var(--color-text-muted); }
    .remove { display: inline-flex; padding: 4px; border: 0; color: var(--color-danger); background: none; cursor: pointer; }
    .add { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; }
    .add label { display: grid; gap: 4px; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
    .add input { width: 140px; }
    .add button { min-height: var(--control-height); padding: 0 16px; border: 1px solid var(--color-primary); border-radius: var(--radius-md); color: var(--color-primary); background: var(--color-primary-soft); font-weight: 600; cursor: pointer; }
  `,
})
export class ProductWholesaleOffers implements OnInit {
  readonly productId = input<string | null>(null);

  private readonly api = inject(WholesalePriceApiService);
  private readonly notifications = inject(NotificationService);

  private readonly access = inject(AccessControlService);
  readonly enabled = signal(this.access.hasFeature(PLAN_FEATURES.wholesale));
  readonly canEdit = this.access.canAccess({ permissions: [APP_PERMISSIONS.wholesaleManage] });
  readonly offers = signal<readonly WholesalePrice[]>([]);
  readonly busy = signal(false);
  readonly total = wholesaleTotal;

  readonly form = new FormGroup({
    quantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.001)] }),
    price: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const id = this.productId();
    if (!this.enabled() || !id) return;
    this.api.list(id).subscribe({ next: (offers) => this.offers.set(offers), error: () => undefined });
  }

  add(): void {
    const id = this.productId();
    const { quantity, price } = this.form.getRawValue();
    if (!id || this.form.invalid || quantity == null || price == null) {
      this.notifications.show('Ingresa la cantidad y el precio por unidad de la oferta.', 'warning');
      return;
    }
    this.busy.set(true);
    this.api.add({ productId: id, quantity, price }).subscribe({
      next: (offer) => {
        this.busy.set(false);
        this.offers.update((offers) =>
          offers.some((item) => item.id === offer.id)
            ? offers
            : [...offers, offer].sort((a, b) => a.quantity - b.quantity || a.price - b.price),
        );
        this.form.reset();
        this.notifications.show('Oferta por mayor agregada.', 'success');
      },
      error: () => {
        this.busy.set(false);
        this.notifications.show('No se pudo agregar la oferta por mayor.', 'error');
      },
    });
  }

  remove(offer: WholesalePrice): void {
    this.busy.set(true);
    this.api.remove(offer.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.offers.update((offers) => offers.filter((item) => item.id !== offer.id));
        this.notifications.show('Oferta por mayor eliminada.', 'success');
      },
      error: () => {
        this.busy.set(false);
        this.notifications.show('No se pudo eliminar la oferta por mayor.', 'error');
      },
    });
  }
}

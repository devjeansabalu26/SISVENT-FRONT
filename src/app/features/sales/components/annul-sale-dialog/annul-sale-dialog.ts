import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { SaleApiService } from '../../data-access/sale-api.service';
import { PaymentMethodOption } from '../../models/payment.model';
import { SaleAnnulmentOptions, SaleDetail } from '../../models/sale-detail.model';
import { MoneyPipe } from '../../../../shared/pipes/date-time.pipe';

export interface AnnulSaleDialogData {
  readonly sale: SaleDetail;
  readonly options: SaleAnnulmentOptions;
  readonly paymentMethods: readonly PaymentMethodOption[];
}

interface AnnulLine {
  readonly productId: string;
  readonly name: string;
  readonly sku: string;
  readonly quantity: number;
}

@Component({
  selector: 'app-annul-sale-dialog',
  imports: [MatDialogModule, MoneyPipe],
  template: `
    <form class="dialog review review--danger" (submit)="$event.preventDefault(); confirm()">
      <header>
        <span class="material-icons">block</span>
        <div class="review__title">
          <h2>Anular venta {{ data.sale.saleNumber }}</h2>
          <p>{{ data.sale.clientName ?? 'Cliente general' }} · {{ data.sale.total | money }} · {{ data.sale.storeName }}</p>
        </div>
      </header>

      <p class="banner">
        <span class="material-icons">warning</span>
        Se anula toda la venta y no se puede deshacer. Si el cliente se lleva otros productos, registra una venta nueva.
      </p>

      <div class="table-scroll">
        <table class="lines">
          <thead>
            <tr><th>Producto</th><th>Vendido</th><th>Vuelve a {{ data.sale.storeName }}</th><th>A desechos</th></tr>
          </thead>
          <tbody>
            @for (line of lines; track line.productId) {
              <tr>
                <td><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></td>
                <td>{{ line.quantity }}</td>
                <td class="ok">{{ returnOf(line) }}</td>
                <td>
                  <input type="number" min="0" [max]="line.quantity" step="1" [value]="wasteOf(line)"
                    [disabled]="!data.options.wasteStoreId" (input)="setWaste(line, $any($event.target).value)"
                    [attr.aria-label]="'Cantidad de ' + line.name + ' a desechos'" />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (data.options.wasteStoreId) {
        <p class="muted">Lo que no está apto para la venta va a <strong>{{ data.options.wasteStoreName }}</strong> y no cuenta como stock disponible. El resto vuelve al local de la venta.</p>
      } @else {
        <p class="muted">Todo vuelve a {{ data.sale.storeName }}. Para enviar productos a desechos, marca un local como "Local de desechos" en Locales.</p>
      }

      @if (data.options.cashClosed) {
        <div class="refund">
          <p>
            <span class="material-icons">payments</span>
            La caja de esta venta ya se cerró. Se devolverán <strong>{{ data.options.refundAmount | money }}</strong>
            @if (data.options.storeHasOpenCash) { desde la caja abierta de {{ data.sale.storeName }}. }
            @else { y quedarán pendientes hasta que se abra la caja de {{ data.sale.storeName }}. }
          </p>
          <label>Método de devolución
            <select [value]="refundMethod()" (change)="refundMethod.set($any($event.target).value)">
              @for (method of data.paymentMethods; track method.code) { <option [value]="method.code">{{ method.name }}</option> }
            </select>
          </label>
        </div>
      }

      <label>
        <span>Motivo de anulación <span class="required">*</span></span>
        <textarea rows="2" maxlength="500" [value]="reason()" (input)="reason.set($any($event.target).value)"
          placeholder="Error en el cobro, cliente devolvió el producto…"></textarea>
      </label>

      @if (error()) { <p class="hint">{{ error() }}</p> }

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="danger" [disabled]="saving()">{{ saving() ? 'Anulando…' : 'Anular venta' }}</button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: `
    .banner, .refund p { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 10px 12px; border-radius: var(--radius-md); font-size: 13px; }
    .banner { color: var(--color-error-text, var(--color-error)); background: color-mix(in srgb, var(--color-error) 10%, var(--color-surface)); }
    .refund { display: grid; gap: 10px; }
    .refund p { color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface)); }
    .lines { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lines th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); }
    .lines td { padding: 8px 10px; border-top: 1px solid var(--color-border); }
    .lines td small { display: block; color: var(--color-text-muted); }
    .lines input { width: 80px; }
    .ok { color: var(--color-success); font-weight: 700; }
    footer .danger { border: 0; color: white; background: var(--color-danger, var(--color-error)); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnulSaleDialog {
  readonly data = inject<AnnulSaleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AnnulSaleDialog, SaleDetail>);
  private readonly api = inject(SaleApiService);

  readonly lines: readonly AnnulLine[] = Object.values(
    this.data.sale.lines.reduce<Record<string, AnnulLine>>((acc, line) => {
      const current = acc[line.productId];
      acc[line.productId] = { productId: line.productId, name: line.productName, sku: line.sku, quantity: (current?.quantity ?? 0) + line.quantity };
      return acc;
    }, {}),
  );
  readonly waste = signal<Record<string, number>>({});
  readonly reason = signal('');
  readonly refundMethod = signal(this.data.options.defaultRefundMethod ?? this.data.paymentMethods[0]?.code ?? '');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  wasteOf(line: AnnulLine): number {
    return this.waste()[line.productId] ?? 0;
  }

  returnOf(line: AnnulLine): number {
    return line.quantity - this.wasteOf(line);
  }

  setWaste(line: AnnulLine, raw: string): void {
    const value = Math.max(0, Math.min(line.quantity, Number(raw) || 0));
    this.waste.update((current) => ({ ...current, [line.productId]: value }));
  }

  confirm(): void {
    const reason = this.reason().trim();
    if (reason.length < 5) {
      this.error.set('Indica el motivo de la anulación (mínimo 5 caracteres).');
      return;
    }
    if (this.data.options.cashClosed && !this.refundMethod()) {
      this.error.set('Elige el método de devolución.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.cancel(this.data.sale.id, {
      reason,
      refundMethod: this.data.options.cashClosed ? this.refundMethod() : null,
      lines: this.lines.map((line) => ({
        productId: line.productId,
        returnQuantity: this.returnOf(line),
        wasteQuantity: this.wasteOf(line),
      })),
    }).subscribe({
      next: (sale) => {
        this.saving.set(false);
        this.dialogRef.close(sale);
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        const body = cause instanceof AppHttpError
          ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
          : undefined;
        this.error.set(typeof body?.title === 'string' && !body.errors ? body.title : 'No se pudo anular la venta.');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { CARD_BRANDS, MAX_PAYMENTS, PaymentDraftLine, PaymentKind, PaymentMethodOption, newPaymentLine } from '../../models/payment.model';
import { breakdown, paymentsError, quickCashAmounts } from '../../utils/payment';

@Component({
  selector: 'app-pos-payment-panel',
  template: `
    @for (line of lines(); track line.key; let index = $index) {
      <fieldset class="line">
        @if (lines().length > 1) {
          <div class="line__head">
            <select aria-label="Método de pago" [value]="line.methodCode" (change)="changeMethod(index, $any($event.target).value)">
              @for (method of methods(); track method.code) {
                <option [value]="method.code">{{ method.name }}</option>
              }
            </select>
            <button type="button" class="remove" (click)="remove(index)" aria-label="Quitar pago">
              <span class="material-icons">close</span>
            </button>
          </div>
        }

        @switch (kindOf(line.methodCode)) {
          @case ('CASH') {
            <label class="field">
              Monto recibido
              <span class="money">
                <em>S/</em>
                <input type="number" inputmode="decimal" min="0" step="0.10" [placeholder]="summary().due.toFixed(2)"
                  [value]="line.amountReceived" (input)="patch(index, { amountReceived: $any($event.target).value })" />
              </span>
            </label>
            @if (lines().length > 1) {
              <small class="hint">Cubre lo que falta: S/ {{ summary().due.toFixed(2) }}</small>
            }
            <div class="quick" role="group" aria-label="Montos rápidos">
              @for (amount of quickAmounts(); track amount; let first = $first) {
                <button type="button" [class.active]="isReceived(line, amount)" (click)="patch(index, { amountReceived: amount.toFixed(2) })">
                  {{ first ? 'Exacto' : 'S/ ' + amount }}
                </button>
              }
            </div>
          }
          @case ('CARD') {
            @if (lines().length > 1) {
              <label class="field">Monto con tarjeta *
                <span class="money"><em>S/</em>
                  <input type="number" inputmode="decimal" min="0" step="0.10" [value]="line.amount" (input)="patch(index, { amount: $any($event.target).value })" />
                </span>
              </label>
            }
            <label class="field">N.º de operación del POS *
              <input maxlength="80" placeholder="Ej. 004512" [value]="line.reference" (input)="patch(index, { reference: $any($event.target).value })" />
            </label>
            <div class="grid">
              <label class="field">Marca
                <select [value]="line.cardBrand" (change)="patch(index, { cardBrand: $any($event.target).value })">
                  @for (brand of brands; track brand.value) {
                    <option [value]="brand.value">{{ brand.label }}</option>
                  }
                </select>
              </label>
              <label class="field">Últimos 4 dígitos
                <input maxlength="4" inputmode="numeric" placeholder="4242" [value]="line.cardLast4" (input)="patch(index, { cardLast4: $any($event.target).value })" />
              </label>
            </div>
            <label class="field">Código de autorización
              <input maxlength="30" placeholder="Opcional" [value]="line.authorizationCode" (input)="patch(index, { authorizationCode: $any($event.target).value })" />
            </label>
          }
          @case ('DIGITAL') {
            @if (lines().length > 1) {
              <label class="field">Monto *
                <span class="money"><em>S/</em>
                  <input type="number" inputmode="decimal" min="0" step="0.10" [value]="line.amount" (input)="patch(index, { amount: $any($event.target).value })" />
                </span>
              </label>
            }
            <label class="field">N.º de operación *
              <input maxlength="80" placeholder="Ej. 98765432" [value]="line.reference" (input)="patch(index, { reference: $any($event.target).value })" />
            </label>
          }
        }
      </fieldset>
    }

    @if (lines().length < maxPayments) {
      <button type="button" class="add" (click)="add()"><span class="material-icons">add</span>Agregar otro método</button>
    }

    <div class="status" [class.status--pending]="summary().pending > 0">
      @if (summary().pending > 0) {
        <span>Por cubrir</span><strong>S/ {{ summary().pending.toFixed(2) }}</strong>
      } @else {
        <span>Vuelto</span><strong>S/ {{ summary().change.toFixed(2) }}</strong>
      }
    </div>

    @if (showErrors() && error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 10px; }
    .line { display: grid; gap: 8px; margin: 0; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .line__head { display: flex; gap: 6px; }
    .field { display: grid; gap: 6px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
    input, select {
      width: 100%; box-sizing: border-box; padding: 9px 11px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font: inherit; background: var(--color-surface);
    }
    input:focus, select:focus { border-color: var(--color-primary); outline: 2px solid var(--color-primary-soft); }
    .line__head select { font-weight: 600; }
    .remove { display: grid; place-items: center; padding: 0 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-danger); cursor: pointer; }
    .remove .material-icons { font-size: 18px; }
    .money { display: flex; align-items: center; gap: 6px; }
    .money em { font-style: normal; color: var(--color-text-muted); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .quick { display: flex; flex-wrap: wrap; gap: 6px; }
    .quick button { padding: 5px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-surface); font-size: 12px; font-weight: 600; cursor: pointer; }
    .quick button.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
    .add { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 8px; border: 1px dashed var(--color-border-strong); border-radius: var(--radius-md); background: transparent; color: var(--color-primary); font-weight: 600; cursor: pointer; }
    .add .material-icons { font-size: 18px; }
    .status { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-md); color: var(--color-success); background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface)); }
    .status strong { font-size: 18px; }
    .status--pending { color: var(--color-warning-text); background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface)); }
    .hint { color: var(--color-text-muted); font-size: 12px; }
    .error { margin: 0; color: var(--color-danger); font-size: 12px; font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPaymentPanel {
  readonly methods = input.required<readonly PaymentMethodOption[]>();
  readonly total = input.required<number>();
  readonly showErrors = input(false);
  readonly lines = model.required<readonly PaymentDraftLine[]>();

  readonly brands = CARD_BRANDS;
  readonly maxPayments = MAX_PAYMENTS;
  readonly kindOf = (code: string): PaymentKind => this.methods().find((method) => method.code === code)?.kind ?? 'DIGITAL';
  readonly summary = computed(() => breakdown(this.lines(), this.kindOf, this.total()));
  readonly error = computed(() => paymentsError(this.lines(), this.kindOf, this.total()));
  readonly quickAmounts = computed(() => quickCashAmounts(this.summary().due));

  patch(index: number, changes: Partial<PaymentDraftLine>): void {
    this.lines.update((lines) => lines.map((line, i) => (i === index ? { ...line, ...changes } : line)));
  }

  changeMethod(index: number, methodCode: string): void {
    this.lines.update((lines) =>
      lines.map((line, i) => (i === index ? { ...newPaymentLine(methodCode, line.amount), key: line.key } : line)),
    );
  }

  add(): void {
    const lines = this.lines();
    const total = this.total();
    const current =
      lines.length === 1 && this.kindOf(lines[0].methodCode) !== 'CASH' && !lines[0].amount.trim()
        ? [{ ...lines[0], amount: total.toFixed(2) }]
        : lines;
    const usedCash = current.some((line) => this.kindOf(line.methodCode) === 'CASH');
    const next = this.methods().find((method) => method.kind === 'CASH' && !usedCash)
      ?? this.methods().find((method) => !current.some((line) => line.methodCode === method.code))
      ?? this.methods()[0];
    const pending = breakdown(current, this.kindOf, total).due;
    this.lines.set([...current, newPaymentLine(next.code, next.kind === 'CASH' ? '' : pending.toFixed(2))]);
  }

  remove(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  isReceived(line: PaymentDraftLine, amount: number): boolean {
    const received = line.amountReceived.trim() ? Number(line.amountReceived.replace(',', '.')) : this.summary().due;
    return Math.abs(received - amount) < 0.005;
  }
}

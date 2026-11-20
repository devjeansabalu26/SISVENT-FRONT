import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { cashStep, moneyInput } from '../../../../core/regional/regional-format';
import { RegionalService } from '../../../../core/regional/regional.service';
import { CARD_BRANDS, MAX_PAYMENTS, PaymentDraftLine, PaymentKind, PaymentMethodOption, newPaymentLine } from '../../models/payment.model';
import { breakdown, invalidPaymentFields, paymentsError, quickCashAmounts } from '../../utils/payment';
import { MoneyPipe } from '../../../../shared/pipes/date-time.pipe';

@Component({
  imports: [MoneyPipe],
  selector: 'app-pos-payment-panel',
  template: `
    @for (line of lines(); track line.key; let index = $index) {
      <fieldset class="line" [class.line--mixed]="lines().length > 1">
        @if (lines().length > 1) {
          <div class="mixed-row">
            <select aria-label="Método de pago" [value]="line.methodCode" (change)="changeMethod(index, $any($event.target).value)">
              @for (method of methods(); track method.code) {
                <option [value]="method.code">{{ method.name }}</option>
              }
            </select>
            <span class="money money--compact">
              <em>{{ regional().currencySymbol }}</em>
              @if (kindOf(line.methodCode) === 'CASH') {
                <input type="number" inputmode="decimal" min="0" [step]="step()" placeholder="Escribe el monto"
                  aria-label="Monto recibido en efectivo" [class.invalid]="bad(line, 'amountReceived')" [value]="line.amountReceived" (input)="patch(index, { amountReceived: $any($event.target).value })" />
              } @else {
                <input type="number" inputmode="decimal" min="0" [step]="step()" placeholder="Monto" aria-label="Monto del pago"
                  [class.invalid]="bad(line, 'amount')" [value]="line.amount" (input)="patch(index, { amount: $any($event.target).value })" />
              }
            </span>
            <button type="button" class="remove" (click)="remove(index)" aria-label="Quitar pago">
              <span class="material-icons">close</span>
            </button>
          </div>
          @if (kindOf(line.methodCode) !== 'CASH') {
            <input class="reference" maxlength="80" [placeholder]="kindOf(line.methodCode) === 'CARD' ? 'N.º de operación del POS *' : 'N.º de operación *'"
              aria-label="Número de operación" [class.invalid]="bad(line, 'reference')" [value]="line.reference" (input)="patch(index, { reference: $any($event.target).value })" />
          }
        } @else {
          @switch (kindOf(line.methodCode)) {
            @case ('CASH') {
              <label class="field">
                Monto recibido
                <span class="money">
                  <em>{{ regional().currencySymbol }}</em>
                  <input type="number" inputmode="decimal" min="0" [step]="step()" placeholder="Escribe el monto"
                    [class.invalid]="bad(line, 'amountReceived')" [value]="line.amountReceived" (input)="patch(index, { amountReceived: $any($event.target).value })" />
                </span>
              </label>
              <div class="quick" role="group" aria-label="Montos rápidos">
                @for (amount of quickAmounts(); track amount; let first = $first) {
                  <button type="button" [class.active]="isReceived(line, amount)" (click)="patch(index, { amountReceived: asInput(amount) })">
                    {{ first ? 'Exacto' : (amount | money) }}
                  </button>
                }
              </div>
            }
            @default {
              <label class="field">{{ kindOf(line.methodCode) === 'CARD' ? 'N.º de operación del POS *' : 'N.º de operación *' }}
                <input maxlength="80" [placeholder]="kindOf(line.methodCode) === 'CARD' ? 'Ej. 004512' : 'Ej. 98765432'" [class.invalid]="bad(line, 'reference')" [value]="line.reference" (input)="patch(index, { reference: $any($event.target).value })" />
              </label>
            }
          }
        }
        @if (kindOf(line.methodCode) === 'CARD') {
          <details class="more" [open]="bad(line, 'cardLast4')">
            <summary>Más datos de la tarjeta (opcional)</summary>
            <div class="grid">
              <label class="field">Marca
                <select [value]="line.cardBrand" (change)="patch(index, { cardBrand: $any($event.target).value })">
                  @for (brand of brands; track brand.value) {
                    <option [value]="brand.value">{{ brand.label }}</option>
                  }
                </select>
              </label>
              <label class="field">Últimos 4 dígitos
                <input maxlength="4" inputmode="numeric" placeholder="4242" [class.invalid]="bad(line, 'cardLast4')" [value]="line.cardLast4" (input)="patch(index, { cardLast4: $any($event.target).value })" />
              </label>
            </div>
            <label class="field">Código de autorización
              <input maxlength="30" placeholder="Opcional" [value]="line.authorizationCode" (input)="patch(index, { authorizationCode: $any($event.target).value })" />
            </label>
          </details>
        }
      </fieldset>
    }

    @if (lines().length < maxPayments) {
      <button type="button" class="add" (click)="add()"><span class="material-icons">add</span>Agregar otro método</button>
    }

    <div class="totals" aria-live="polite">
      <div class="totals__row"><span>Total a cobrar</span><span>{{ total() | money }}</span></div>
      <div class="totals__row"><span>Recibido</span><span>{{ received() | money }}</span></div>
      <div class="status" [class.status--pending]="summary().pending > 0">
        @if (summary().pending > 0) {
          <span>Falta cobrar</span><strong>{{ summary().pending | money }}</strong>
        } @else {
          <span>Vuelto</span><strong>{{ summary().change | money }}</strong>
        }
      </div>
    </div>

    @if (showErrors() && error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 10px; }
    .line { display: grid; gap: 8px; min-width: 0; margin: 0; padding: 0; border: 0; }
    .line--mixed { gap: 6px; padding: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .mixed-row { display: grid; grid-template-columns: 104px minmax(0, 1fr) 34px; gap: 6px; align-items: center; }
    .mixed-row select { padding: 8px; font-weight: 600; }
    .mixed-row .remove { height: 38px; }
    .money.money--compact input { height: 38px; font-size: 16px; font-weight: 600; }
    .money.money--compact em { font-size: 16px; }
    .reference { padding: 7px 10px; font-size: 15px; }
    .more summary { color: var(--color-primary); font-size: 14px; font-weight: 600; cursor: pointer; }
    .more[open] { display: grid; gap: 8px; }
    .field { display: grid; gap: 6px; font-size: 14px; font-weight: 600; color: var(--color-text-secondary); }
    input, select {
      width: 100%; box-sizing: border-box; padding: 9px 11px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font: inherit; background: var(--color-surface);
    }
    input:focus, select:focus { border-color: var(--color-primary); outline: 2px solid var(--color-primary-soft); }
    .remove { display: grid; place-items: center; padding: 0 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-danger); cursor: pointer; }
    .remove .material-icons { font-size: 18px; }
    .money { display: flex; align-items: center; gap: 8px; }
    .money em { font-style: normal; color: var(--color-text-muted); font-size: 18px; font-weight: 600; }
    .money input { height: 52px; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .quick { display: flex; flex-wrap: wrap; gap: 6px; }
    .quick button { padding: 7px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-surface); font-size: 14px; font-weight: 600; cursor: pointer; }
    .quick button.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
    .add { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 8px; border: 1px dashed var(--color-border-strong); border-radius: var(--radius-md); background: transparent; color: var(--color-primary); font-weight: 600; cursor: pointer; }
    .add .material-icons { font-size: 18px; }
    .totals { display: grid; gap: 4px; }
    .totals__row { display: flex; justify-content: space-between; padding: 0 12px; color: var(--color-text-secondary); font-size: 15px; }
    .totals__row span:last-child { font-weight: 600; color: var(--color-text-primary); }
    .status { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-md); color: var(--color-success); background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface)); }
    .status strong { font-size: 18px; }
    .status--pending { color: var(--color-warning-text); background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface)); }
    .hint { color: var(--color-text-muted); font-size: 14px; }
    .error { margin: 0; color: var(--color-danger); font-size: 14px; font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPaymentPanel {
  readonly methods = input.required<readonly PaymentMethodOption[]>();
  readonly total = input.required<number>();
  readonly showErrors = input(false);
  readonly lines = model.required<readonly PaymentDraftLine[]>();

  protected readonly regional = inject(RegionalService).regional;
  protected readonly step = computed(() => cashStep(this.regional()));
  protected readonly asInput = (value: number): string => moneyInput(value, this.regional());
  readonly brands = CARD_BRANDS;
  readonly maxPayments = MAX_PAYMENTS;
  readonly kindOf = (code: string): PaymentKind => this.methods().find((method) => method.code === code)?.kind ?? 'DIGITAL';
  readonly summary = computed(() => breakdown(this.lines(), this.kindOf, this.total()));
  readonly error = computed(() => paymentsError(this.lines(), this.kindOf, this.total()));
  private readonly invalid = computed(() => (this.showErrors() ? invalidPaymentFields(this.lines(), this.kindOf, this.total()) : new Set<string>()));
  protected bad(line: PaymentDraftLine, field: string): boolean {
    return this.invalid().has(`${line.key}:${field}`);
  }
  readonly quickAmounts = computed(() => quickCashAmounts(this.summary().due));
  readonly received = computed(() => {
    const summary = this.summary();
    return summary.nonCash + (summary.cashReceived !== null && Number.isFinite(summary.cashReceived) ? summary.cashReceived : 0);
  });

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
        ? [{ ...lines[0], amount: moneyInput(total) }]
        : lines;
    const usedCash = current.some((line) => this.kindOf(line.methodCode) === 'CASH');
    const next = this.methods().find((method) => method.kind === 'CASH' && !usedCash)
      ?? this.methods().find((method) => !current.some((line) => line.methodCode === method.code))
      ?? this.methods()[0];
    const pending = breakdown(current, this.kindOf, total).due;
    this.lines.set([...current, newPaymentLine(next.code, next.kind === 'CASH' ? '' : moneyInput(pending))]);
  }

  remove(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  isReceived(line: PaymentDraftLine, amount: number): boolean {
    if (!line.amountReceived.trim()) return false;
    return Math.abs(Number(line.amountReceived.replace(',', '.')) - amount) < 0.005;
  }
}

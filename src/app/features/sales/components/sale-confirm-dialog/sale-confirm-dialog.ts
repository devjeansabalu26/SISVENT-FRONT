import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { formatSoles } from '../../../../shared/utils/diff-rows';
import { AttendancePerson, ROLE_LABELS } from '../../../attendance/models/attendance.model';

export interface SaleConfirmLine {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface SaleConfirmData {
  readonly customer: string;
  readonly lines: readonly SaleConfirmLine[];
  readonly discount: number;
  readonly paymentMethod: string;
  readonly paymentDetails?: readonly string[];
  readonly seller: SaleConfirmSeller;
}

export interface SaleConfirmSeller {
  readonly attendanceEnabled: boolean;
  readonly present: readonly AttendancePerson[];
  readonly defaultProfileId: string | null;
  readonly loggedUserName: string;
  readonly loggedUserRole: string;
}

export interface SaleConfirmResult {
  readonly sellerProfileId: string | null;
}

@Component({
  selector: 'app-sale-confirm-dialog',
  imports: [MatDialogModule, DatePipe],
  template: `
    <form class="dialog review" (submit)="confirm($event)">
      <header>
        <span class="material-icons">shopping_cart</span>
        <div class="review__title"><h2>Confirmar venta</h2></div>
        <small class="review__code">MOD-AD-18</small>
      </header>

      <dl class="review__meta">
        <div><dt>Cliente</dt><dd>{{ data.customer }}</dd></div>
        <div><dt>Método de pago</dt><dd>{{ data.paymentMethod }}</dd></div>
        @for (detail of data.paymentDetails ?? []; track $index) {
          <div><dt>{{ $first ? 'Detalle del pago' : '' }}</dt><dd>{{ detail }}</dd></div>
        }
      </dl>

      <div class="table-scroll">
        <table class="review__diff">
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            @for (line of data.lines; track line.name) {
              <tr>
                <td>{{ line.name }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ soles(line.unitPrice) }}</td>
                <td>{{ soles(line.unitPrice * line.quantity) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <dl class="expected">
        <div><dt>Subtotal</dt><dd>{{ soles(subtotal) }}</dd></div>
        <div><dt>Descuento</dt><dd>-{{ soles(data.discount) }}</dd></div>
        <div><dt><strong>Total</strong></dt><dd class="total">{{ soles(subtotal - data.discount) }}</dd></div>
      </dl>

      <section class="seller">
        <span class="seller__label">Vendedor responsable</span>
        <div class="seller__card">
          <span class="seller__avatar">{{ responsibleName().charAt(0) }}</span>
          <div class="seller__data">
            <strong>{{ responsibleName() }}</strong>
            @if (selected(); as person) {
              <small>{{ roleLabel(person.role) }}{{ person.userCode ? ' · Usuario ' + person.userCode : '' }} · en turno desde {{ person.checkInAt | date: 'HH:mm' }}</small>
            } @else {
              <small>{{ roleLabel(data.seller.loggedUserRole) }} · sesión actual</small>
            }
          </div>
          @if (others().length) {
            <button type="button" class="seller__change" (click)="change()">
              <span class="material-icons">swap_horiz</span>Cambiar
            </button>
          }
        </div>
        @if (choosing()) {
          <div class="seller__options">
            @for (person of others(); track person.profileId) {
              <button type="button" (click)="choose(person.profileId)">
                <span class="material-icons">person</span>{{ person.fullName }}
                <small>{{ roleLabel(person.role) }} · desde {{ person.checkInAt | date: 'HH:mm' }}</small>
              </button>
            }
          </div>
        }
      </section>

      <footer>
        <button type="button" (click)="cancel()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="data.seller.attendanceEnabled && !selected()">Confirmar venta</button>
      </footer>
    </form>
  `,
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: `
    .review__diff td:not(:first-child),
    .review__diff th:not(:first-child) { text-align: right; }
    .total { color: var(--color-primary); font-size: var(--font-size-lg); }
    .seller { display: grid; gap: 8px; }
    .seller__label { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 600; }
    .seller__card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .seller__avatar { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%;
      color: var(--color-on-primary, white); background: var(--color-primary); font-weight: 700; text-transform: uppercase; }
    .seller__data { display: grid; flex: 1; gap: 2px; min-width: 0; }
    .seller__data small { color: var(--color-text-muted); font-size: 12px; }
    .seller__change { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--color-primary);
      border-radius: var(--radius-md); color: var(--color-primary); background: var(--color-surface); font: inherit; font-weight: 600; cursor: pointer; }
    .seller__change .material-icons { font-size: 18px; }
    .seller__options { display: grid; gap: 6px; }
    .seller__options button { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); background: var(--color-surface); font: inherit; text-align: left; cursor: pointer; }
    .seller__options button:hover { border-color: var(--color-primary); }
    .seller__options small { color: var(--color-text-muted); }
    .seller__options .material-icons { font-size: 18px; color: var(--color-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleConfirmDialog {
  readonly data = inject<SaleConfirmData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SaleConfirmDialog, SaleConfirmResult | false>);
  readonly soles = formatSoles;
  readonly subtotal = this.data.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  private readonly present = this.data.seller.attendanceEnabled ? this.data.seller.present : [];
  readonly selectedId = signal<string | null>(
    this.present.find((person) => person.profileId === this.data.seller.defaultProfileId)?.profileId ?? this.present[0]?.profileId ?? null,
  );
  readonly selected = computed(() => this.present.find((person) => person.profileId === this.selectedId()) ?? null);
  readonly others = computed(() => this.present.filter((person) => person.profileId !== this.selectedId()));
  readonly responsibleName = computed(() => this.selected()?.fullName ?? this.data.seller.loggedUserName);
  readonly choosing = signal(false);

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  change(): void {
    const others = this.others();
    if (others.length === 1) {
      this.selectedId.set(others[0].profileId);
      return;
    }
    this.choosing.update((value) => !value);
  }

  choose(profileId: string): void {
    this.selectedId.set(profileId);
    this.choosing.set(false);
  }

  confirm(event: Event): void {
    event.preventDefault();
    if (this.data.seller.attendanceEnabled && !this.selected()) return;
    this.dialogRef.close({ sellerProfileId: this.data.seller.attendanceEnabled ? this.selectedId() : null });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CashSessionApiService, CashSessionDetail, cashErrorMessage } from '../../data-access/cash-session-api.service';
import { DateTimePipe, DayMonthTimePipe, MoneyPipe } from '../../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-cash-session-detail-dialog',
  imports: [MatDialogModule, MoneyPipe, DateTimePipe, DayMonthTimePipe],
  template: `
    <section class="dialog detail">
      <header>
        <span class="material-icons">receipt_long</span>
        <div>
          <h2>Ventas de la caja</h2>
          @if (detail(); as d) {
            <p>{{ d.session.storeName }} · {{ d.session.openedBy }} · {{ d.session.openedAt | dateTime }}
              @if (d.session.closedAt) { — {{ d.session.closedAt | dayMonthTime }} }</p>
          }
        </div>
      </header>

      @if (loading()) {
        <p class="muted">Cargando ventas…</p>
      } @else if (error()) {
        <p class="hint" role="alert">{{ error() }}</p>
      } @else if (detail(); as d) {
        <dl class="summary">
          <div><dt>Estado</dt><dd>{{ d.session.status === 'OPEN' ? 'Abierta' : d.session.forced ? 'Cerrada (forzado)' : 'Cerrada' }}</dd></div>
          <div><dt>Fondo inicial</dt><dd>{{ d.session.openingAmount | money }}</dd></div>
          <div><dt>Total ventas</dt><dd>{{ d.session.totalSales | money }}</dd></div>
          @if (d.session.totalRefunds > 0) { <div><dt>Devoluciones</dt><dd class="bad">- {{ d.session.totalRefunds | money }}</dd></div> }
          <div><dt>Efectivo esperado</dt><dd>{{ d.session.expectedCash | money }}</dd></div>
          @if (d.session.countedCash !== null) {
            <div><dt>Contado</dt><dd>{{ d.session.countedCash | money }}</dd></div>
            <div><dt>Diferencia</dt><dd [class.bad]="d.session.difference !== 0">{{ (d.session.difference ?? 0) | money }}</dd></div>
          }
          @if (d.session.closedBy) { <div><dt>Cerrada por</dt><dd>{{ d.session.closedBy }}</dd></div> }
        </dl>
        @if (d.session.forceReason) { <p class="muted">Motivo del cierre forzado: {{ d.session.forceReason }}</p> }
        @if (d.session.notes) { <p class="muted">Observaciones: {{ d.session.notes }}</p> }

        <div class="table-scroll">
          <table>
            <thead><tr><th>Nro venta</th><th>Hora</th><th>Cliente</th><th>Vendedor</th><th>Método</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              @for (sale of d.sales; track sale.id) {
                <tr [class.cancelled]="sale.status !== 'CONFIRMED'">
                  <td>{{ sale.saleNumber }}</td>
                  <td>{{ sale.saleDate | dayMonthTime }}</td>
                  <td>{{ sale.clientName ?? 'Cliente general' }}</td>
                  <td>{{ sale.sellerName }}</td>
                  <td>{{ sale.paymentMethod }}</td>
                  <td>{{ sale.total | money }}</td>
                  <td>{{ sale.status === 'CONFIRMED' ? 'Confirmada' : 'Anulada' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty">Aún no hay ventas en esta caja.</td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (d.refunds.length) {
          <h3 class="sub">Notas de crédito del turno</h3>
          <div class="table-scroll">
            <table>
              <thead><tr><th>N.º nota</th><th>Hora</th><th>Venta</th><th>Reembolso</th><th>Total</th><th>Emitida por</th></tr></thead>
              <tbody>
                @for (refund of d.refunds; track refund.id) {
                  <tr><td>{{ refund.creditNoteNumber }}</td><td>{{ refund.issuedAt | dayMonthTime }}</td><td>{{ refund.saleNumber }}</td>
                    <td>{{ refund.refundMethod }}</td><td>- {{ refund.total | money }}</td><td>{{ refund.createdBy }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <footer><button type="button" (click)="close()">Cerrar</button></footer>
    </section>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .detail { width: min(860px, calc(100vw - 40px)); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 10px; margin: 0; }
    .summary div { display: grid; gap: 2px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .summary dt { color: var(--color-text-muted); font-size: 12px; }
    .summary dd { margin: 0; font-weight: 700; }
    .bad { color: var(--color-danger); }
    .table-scroll { max-height: 340px; overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); white-space: nowrap; }
    td { padding: 9px 10px; border-top: 1px solid var(--color-border); white-space: nowrap; }
    tr.cancelled td { color: var(--color-text-muted); text-decoration: line-through; }
    .empty { text-align: center; color: var(--color-text-muted); text-decoration: none; }
    .sub { margin: 4px 0 0; font-size: 14px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashSessionDetailDialog implements OnInit {
  private readonly id = inject<string>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CashSessionDetailDialog>);
  private readonly api = inject(CashSessionApiService);

  readonly detail = signal<CashSessionDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.get(this.id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (cause: unknown) => {
        this.loading.set(false);
        this.error.set(cashErrorMessage(cause, 'No se pudo cargar la caja.'));
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

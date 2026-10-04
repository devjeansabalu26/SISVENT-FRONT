import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { cashErrorMessage } from '../../data-access/cash-session-api.service';
import { CreditNoteApiService, CreditNoteDetail } from '../../data-access/credit-note-api.service';

@Component({
  selector: 'app-credit-note-detail-dialog',
  imports: [MatDialogModule, DatePipe, RouterLink],
  template: `
    <section class="dialog detail">
      <header>
        <span class="material-icons">assignment_return</span>
        <div>
          <h2>Nota de crédito {{ detail()?.note?.creditNoteNumber ?? '' }}</h2>
          @if (detail(); as d) { <p>{{ d.note.issuedAt | date: 'dd/MM/yyyy HH:mm' }} · {{ d.note.storeName }} · {{ d.note.createdBy }}</p> }
        </div>
      </header>

      @if (loading()) {
        <p class="muted">Cargando…</p>
      } @else if (error()) {
        <p class="hint" role="alert">{{ error() }}</p>
      } @else if (detail(); as d) {
        <dl class="summary">
          <div><dt>Venta</dt><dd><a [routerLink]="['/app/sales', d.note.saleId]" (click)="close()">{{ d.note.saleNumber }}</a></dd></div>
          <div><dt>Cliente</dt><dd>{{ d.note.clientName ?? 'Cliente general' }}</dd></div>
          <div><dt>Reembolso</dt><dd>{{ d.note.refundMethod }}</dd></div>
          <div><dt>Total</dt><dd>S/ {{ d.note.total.toFixed(2) }}</dd></div>
        </dl>
        <p class="muted">Motivo: {{ d.note.reason }}</p>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Cantidad</th><th>P. neto</th><th>Importe</th></tr></thead>
            <tbody>
              @for (line of d.lines; track line.productId) {
                <tr><td>{{ line.productName }}</td><td>{{ line.sku }}</td><td>{{ line.quantity }}</td>
                  <td>S/ {{ line.unitPrice.toFixed(2) }}</td><td>S/ {{ line.subtotal.toFixed(2) }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
      <footer><button type="button" (click)="close()">Cerrar</button></footer>
    </section>
  `,
  styleUrl: '../../../../shared/forms/dialog-form.scss',
  styles: `
    .detail { width: min(720px, calc(100vw - 40px)); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 0; }
    .summary div { display: grid; gap: 2px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-surface-secondary); }
    .summary dt { color: var(--color-text-muted); font-size: 12px; }
    .summary dd { margin: 0; font-weight: 700; }
    .summary a { color: var(--color-primary); text-decoration: none; }
    .table-scroll { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); }
    td { padding: 9px 10px; border-top: 1px solid var(--color-border); white-space: nowrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditNoteDetailDialog implements OnInit {
  private readonly id = inject<string>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CreditNoteDetailDialog>);
  private readonly api = inject(CreditNoteApiService);

  readonly detail = signal<CreditNoteDetail | null>(null);
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
        this.error.set(cashErrorMessage(cause, 'No se pudo cargar la nota de crédito.'));
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

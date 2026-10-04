import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CreditNoteDetailDialog } from '../components/credit-note-dialogs/credit-note-detail-dialog';
import { CreditNoteApiService, CreditNoteListItem } from '../data-access/credit-note-api.service';

@Component({
  selector: 'app-credit-notes-page',
  imports: [PageHeader, RouterLink, DatePipe],
  template: `
    <app-page-header title="Notas de crédito" description="Devoluciones totales o parciales de ventas">
      <a class="ghost" routerLink="/app/sales"><span class="material-icons">arrow_back</span>Ventas</a>
    </app-page-header>

    <section class="filters">
      <label class="search"><span class="material-icons">search</span>
        <input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()"
          placeholder="Escribe el n.º de nota, venta o cliente" /></label>
      <label>Desde <input type="date" [value]="from()" (change)="from.set($any($event.target).value)" /></label>
      <label>Hasta <input type="date" [value]="to()" (change)="to.set($any($event.target).value)" /></label>
      <button type="button" class="ghost" (click)="clear()">Limpiar</button>
      <button type="button" class="primary" (click)="load()">Filtrar</button>
    </section>

    <div class="kpis">
      <article><span>Notas emitidas</span><strong>{{ rows().length }}</strong></article>
      <article><span>Total devuelto</span><strong>S/ {{ total().toFixed(2) }}</strong></article>
    </div>

    <div class="table-scroll surface-card">
      @if (loading()) {
        <p class="state">Cargando notas de crédito…</p>
      } @else if (!rows().length) {
        <p class="state">No hay notas de crédito. Se emiten desde el detalle de una venta.</p>
      } @else {
        <table>
          <thead><tr><th>N.º nota</th><th>Fecha</th><th>Venta</th><th>Cliente</th><th>Local</th><th>Reembolso</th><th>Total</th><th>Emitida por</th><th>Motivo</th></tr></thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr (click)="open(row)" title="Ver detalle">
                <td>{{ row.creditNoteNumber }}</td>
                <td>{{ row.issuedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ row.saleNumber }}</td>
                <td>{{ row.clientName ?? 'Cliente general' }}</td>
                <td>{{ row.storeName }}</td>
                <td>{{ row.refundMethod }}</td>
                <td>S/ {{ row.total.toFixed(2) }}</td>
                <td>{{ row.createdBy }}</td>
                <td class="reason">{{ row.reason }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: `
    .filters { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; margin-bottom: var(--space-md); }
    .filters label { display: grid; gap: 4px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
    .filters .search { display: flex; align-items: center; gap: 6px; min-width: 260px; flex: 1; }
    .filters .search input { flex: 1; }
    .ghost, .primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: var(--radius-md); font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
    .ghost { border: 1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
    .primary { border: 0; color: var(--color-on-primary, white); background: var(--color-primary); }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: var(--space-md); }
    .kpis article { display: grid; gap: 4px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .kpis span { color: var(--color-text-muted); font-size: 12px; }
    .kpis strong { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); white-space: nowrap; }
    td { padding: 10px 12px; border-top: 1px solid var(--color-border); white-space: nowrap; }
    td.reason { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--color-surface-secondary); }
    .state { padding: 32px; text-align: center; color: var(--color-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditNotesPage implements OnInit {
  private readonly api = inject(CreditNoteApiService);
  private readonly dialog = inject(MatDialog);

  readonly rows = signal<readonly CreditNoteListItem[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly from = signal('');
  readonly to = signal('');
  readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.total, 0));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({ search: this.search().trim() || undefined, from: this.from() || undefined, to: this.to() || undefined })
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  clear(): void {
    this.search.set('');
    this.from.set('');
    this.to.set('');
    this.load();
  }

  open(row: CreditNoteListItem): void {
    this.dialog.open(CreditNoteDetailDialog, { data: row.id });
  }
}

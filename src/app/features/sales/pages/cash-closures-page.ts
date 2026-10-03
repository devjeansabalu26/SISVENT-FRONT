import { localIsoDate } from '../../../shared/utils/date-format';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CashCloseDialog } from '../components/cash-close-dialog/cash-close-dialog';
import { CashClosure, CashClosureApiService } from '../data-access/cash-closure-api.service';

/** Historial de cierres de caja por local y día (ADMIN). */
@Component({
  selector: 'app-cash-closures-page',
  imports: [PageHeader, RouterLink, DatePipe],
  template: `
    <app-page-header title="Cierres de caja" description="Historial de cierres por local y día">
      <a class="ghost" routerLink="/app/sales"><span class="material-icons">arrow_back</span>Ventas</a>
      <button type="button" class="primary" (click)="closeCash()"><span class="material-icons">point_of_sale</span>Cerrar caja</button>
    </app-page-header>

    <section class="filters">
      <label>Desde <input type="date" [value]="from()" (change)="from.set($any($event.target).value)" /></label>
      <label>Hasta <input type="date" [value]="to()" (change)="to.set($any($event.target).value)" /></label>
      <button type="button" class="ghost" (click)="load()">Filtrar</button>
    </section>

    <div class="kpis">
      <article><span>Cierres</span><strong>{{ rows().length }}</strong></article>
      <article><span>Ventas del período</span><strong>S/ {{ totals().sales.toFixed(2) }}</strong></article>
      <article [class.bad]="totals().difference !== 0"><span>Diferencia acumulada</span><strong>S/ {{ totals().difference.toFixed(2) }}</strong></article>
    </div>

    <div class="table-scroll surface-card">
      @if (loading()) {
        <p class="state">Cargando cierres…</p>
      } @else if (!rows().length) {
        <p class="state">No hay cierres de caja en este período.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Día</th><th>Local</th><th>Ventas</th><th>Total</th><th>Efectivo esperado</th><th>Contado</th><th>Diferencia</th><th>Cerrado por</th><th>Observaciones</th></tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>{{ row.businessDate | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                <td>{{ row.storeName }}</td>
                <td>{{ row.salesCount }}</td>
                <td>S/ {{ row.totalSales.toFixed(2) }}</td>
                <td>S/ {{ row.expectedCash.toFixed(2) }}</td>
                <td>S/ {{ row.countedCash.toFixed(2) }}</td>
                <td [class.ok]="row.difference === 0" [class.bad]="row.difference !== 0">S/ {{ row.difference.toFixed(2) }}</td>
                <td>{{ row.closedBy }} <small>{{ row.createdAt | date: 'dd/MM HH:mm' }}</small></td>
                <td>{{ row.notes ?? '—' }}</td>
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
    input { padding: 9px 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font: inherit; }
    .ghost, .primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: var(--radius-md); font-weight: 600; text-decoration: none; cursor: pointer; }
    .ghost { border: 1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-surface); }
    .primary { border: 0; color: var(--color-on-primary, white); background: var(--color-primary); }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: var(--space-md); }
    .kpis article { display: grid; gap: 4px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .kpis span { color: var(--color-text-muted); font-size: 12px; }
    .kpis strong { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--color-text-secondary); background: var(--color-surface-secondary); white-space: nowrap; }
    td { padding: 10px 12px; border-top: 1px solid var(--color-border); white-space: nowrap; }
    td small { color: var(--color-text-muted); }
    .ok { color: var(--color-success); font-weight: 600; }
    .bad, .kpis .bad strong { color: var(--color-danger); font-weight: 600; }
    .state { padding: 32px; text-align: center; color: var(--color-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashClosuresPage implements OnInit {
  private readonly api = inject(CashClosureApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly rows = signal<readonly CashClosure[]>([]);
  readonly from = signal(localIsoDate(new Date(Date.now() - 30 * 86400000)));
  readonly to = signal(localIsoDate());

  readonly totals = computed(() => ({
    sales: this.rows().reduce((sum, row) => sum + row.totalSales, 0),
    difference: Math.round(this.rows().reduce((sum, row) => sum + row.difference, 0) * 100) / 100,
  }));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ from: this.from(), to: this.to() }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar los cierres de caja.', 'error');
      },
    });
  }

  closeCash(): void {
    this.dialog
      .open<CashCloseDialog, void, CashClosure>(CashCloseDialog)
      .afterClosed()
      .subscribe((closure) => {
        if (!closure) return;
        this.notifications.show(`Caja cerrada: diferencia S/ ${closure.difference.toFixed(2)}.`, closure.difference === 0 ? 'success' : 'warning');
        this.load();
      });
  }
}

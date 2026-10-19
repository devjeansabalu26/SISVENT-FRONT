import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { DashboardApiService } from '../../data-access/dashboard-api.service';
import { StoresTodayResponse } from '../../models/dashboard.model';
import { MoneyPipe } from '../../../../shared/pipes/date-time.pipe';
import { formatTime } from '../../../../core/regional/regional-format';

@Component({
  selector: 'app-stores-today',
  imports: [RouterLink, MoneyPipe],
  template: `
    @if (data(); as d) {
      <section class="today surface-card">
        <div class="today__head">
          <h2>Hoy por local</h2>
          <span class="muted">Se actualiza cada minuto</span>
          <a routerLink="/app/attendance" class="link">Asistencia</a>
          <a routerLink="/app/sales/cash" class="link">Caja</a>
        </div>
        <div class="today__grid">
          @for (store of d.stores; track store.storeId) {
            <article class="store" [class.store--alert]="store.alerts.length">
              <header>
                <h3>{{ store.storeName }}</h3>
                <span class="chip" [class.chip--ok]="store.cash">{{ store.cash ? 'Caja abierta' : 'Caja cerrada' }}</span>
              </header>
              <dl>
                <div><dt>Ventas de hoy</dt><dd>{{ store.salesCount }} · {{ store.salesTotal | money }}</dd></div>
                @if (store.cash; as cash) {
                  <div><dt>Efectivo esperado</dt><dd>{{ cash.expectedCash | money }}</dd></div>
                  <div><dt>Abrió</dt><dd>{{ cash.openedBy }} · {{ hour(cash.openedAt) }}</dd></div>
                }
              </dl>
              @if (d.attendanceEnabled) {
                <p class="people">
                  <span class="material-icons">badge</span>
                  @if (store.present.length) {
                    @for (person of store.present; track $index) {
                      <span>{{ person.fullName }} <small>{{ hour(person.checkInAt) }}</small>{{ $last ? '' : ',' }}</span>
                    }
                  } @else {
                    <span class="muted">Nadie en turno</span>
                  }
                </p>
              }
              @for (alert of store.alerts; track alert.code) {
                <p class="alert" [class.alert--high]="alert.code === 'CASH_OPEN_UNATTENDED'">
                  <span class="material-icons">{{ alert.code === 'CASH_CLOSED_WITH_STAFF' ? 'info' : 'warning' }}</span>{{ alert.message }}
                </p>
              }
            </article>
          } @empty {
            <p class="muted">No hay locales activos.</p>
          }
        </div>
      </section>
    }
  `,
  styles: `
    .today { margin-bottom: 20px; }
    .today__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; margin-bottom: 12px; }
    .today__head h2 { margin: 0 auto 0 0; font-size: 16px; }
    .link { color: var(--color-primary); font-size: 13px; font-weight: 600; text-decoration: none; }
    .muted { color: var(--color-text-muted); font-size: 12px; }
    .today__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); gap: 12px; }
    .store { display: grid; align-content: start; gap: 8px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .store--alert { border-color: color-mix(in srgb, var(--color-warning) 55%, var(--color-border)); }
    .store header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .store h3 { margin: 0; font-size: 14px; }
    .chip { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--color-text-secondary); background: var(--color-surface-secondary); white-space: nowrap; }
    .chip--ok { color: var(--color-success-text, var(--color-success)); background: color-mix(in srgb, var(--color-success) 14%, var(--color-surface)); }
    dl { display: grid; gap: 4px; margin: 0; }
    dl div { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
    dt { color: var(--color-text-muted); }
    dd { margin: 0; font-weight: 600; text-align: right; }
    .people { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0; font-size: 12px; }
    .people .material-icons { font-size: 16px; color: var(--color-primary); }
    .people small { color: var(--color-text-muted); }
    .alert { display: flex; align-items: center; gap: 6px; margin: 0; padding: 6px 8px; border-radius: var(--radius-sm, 6px); font-size: 12px;
      color: var(--color-text-secondary); background: var(--color-surface-secondary); }
    .alert .material-icons { font-size: 16px; }
    .alert--high { color: var(--color-error-text, var(--color-error)); background: color-mix(in srgb, var(--color-error) 10%, var(--color-surface)); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoresTodayPanel implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = signal<StoresTodayResponse | null>(null);

  ngOnInit(): void {
    this.load();
    interval(60_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  hour(value: string): string {
    return formatTime(value);
  }

  private load(): void {
    this.api.storesToday().subscribe({ next: (data) => this.data.set(data), error: () => undefined });
  }
}

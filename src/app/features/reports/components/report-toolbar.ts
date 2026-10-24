import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReportState } from '../data-access/report-state';
import { REPORT_PERIODS, ReportPeriod } from '../utils/report-period';

@Component({
  selector: 'app-report-toolbar',
  template: `
    <section class="report-toolbar" aria-label="Filtros del reporte">
      <div class="report-toolbar__periods" role="group" aria-label="Periodo">
        @for (period of periods; track period.id) {
          <button type="button" [class.active]="state.period() === period.id" [attr.aria-pressed]="state.period() === period.id"
            (click)="choose(period.id)">{{ period.label }}</button>
        }
      </div>
      @if (state.stores().length > 1) {
        <label class="report-toolbar__store">
          <span class="material-icons" aria-hidden="true">store</span>
          <select #storeSelect aria-label="Local" [value]="state.storeId()" (change)="state.setStore(storeSelect.value)">
            <option value="">Todos los locales</option>
            @for (store of state.stores(); track store.id) {
              <option [value]="store.id">{{ store.name }}</option>
            }
          </select>
        </label>
      }
    </section>
  `,
  styles: `
    :host { display: block; position: sticky; top: 8px; z-index: 5; margin: 0 0 16px; }
    .report-toolbar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--color-surface) 92%, transparent); backdrop-filter: blur(6px); box-shadow: var(--shadow-sm);
    }
    .report-toolbar__periods { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
    .report-toolbar__periods::-webkit-scrollbar { display: none; }
    .report-toolbar__periods button {
      flex-shrink: 0; padding: 7px 12px; border: 1px solid transparent; border-radius: 999px;
      color: var(--color-text-secondary); background: transparent; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer;
    }
    .report-toolbar__periods button:hover { background: var(--color-surface-secondary); }
    .report-toolbar__periods button.active { border-color: color-mix(in srgb, var(--color-primary) 35%, transparent); color: var(--color-primary); background: var(--color-primary-soft); }
    .report-toolbar__store {
      display: flex; align-items: center; gap: 6px; height: var(--control-height); padding: 0 10px;
      border: 1px solid var(--control-border); border-radius: var(--control-radius); background: var(--control-bg);
    }
    .report-toolbar__store .material-icons { font-size: 18px; color: var(--color-text-muted); }
    .report-toolbar__store select, .report-toolbar__store select:focus { height: 100%; padding: 0 4px; border: 0; box-shadow: none; background: transparent; }
    @media (max-width: 560px) { .report-toolbar__store { width: 100%; } .report-toolbar__store select { width: 100%; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportToolbar {
  readonly state = inject(ReportState);
  readonly periods = REPORT_PERIODS;

  choose(period: ReportPeriod): void {
    this.state.setPeriod(period);
  }
}

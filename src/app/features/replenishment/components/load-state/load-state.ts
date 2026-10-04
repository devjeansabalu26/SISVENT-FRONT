import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';

export type LoadState = 'loading' | 'ready' | 'plan-blocked' | 'error';

export function loadStateFor(cause: unknown): LoadState {
  return cause instanceof AppHttpError && cause.status === 403 ? 'plan-blocked' : 'error';
}

@Component({
  selector: 'app-replenishment-load-state',
  imports: [RouterLink],
  template: `
    @switch (state()) {
      @case ('loading') {
        <section class="state">Calculando indicadores de abastecimiento…</section>
      }
      @case ('plan-blocked') {
        <section class="state state--plan">
          <span class="material-icons" aria-hidden="true">workspace_premium</span>
          <h2>Disponible en el plan Profesional</h2>
          <p>
            El análisis de abastecimiento, rotación y clasificación ABC se calcula con tus ventas e inventario reales,
            pero tu plan actual no incluye esta funcionalidad.
          </p>
          <a routerLink="/app/plan" class="cta">Ver planes</a>
        </section>
      }
      @case ('error') {
        <section class="state">
          <p>No se pudo calcular el análisis de abastecimiento.</p>
          <button type="button" class="retry" (click)="retry.emit()">Reintentar</button>
        </section>
      }
    }
  `,
  styles: `
    .state {
      display: grid;
      place-items: center;
      gap: 12px;
      padding: 48px 24px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      background: var(--color-surface);
      text-align: center;
    }
    .state h2,
    .state p {
      margin: 0;
    }
    .state p {
      max-width: 56ch;
    }
    .state--plan .material-icons {
      font-size: 40px;
      color: var(--color-primary);
    }
    .state--plan h2 {
      color: var(--color-text-primary);
    }
    .cta,
    .retry {
      padding: 9px 18px;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .cta {
      border: 0;
      color: white;
      background: var(--color-primary);
    }
    .retry {
      border: 1px solid var(--color-border);
      background: var(--color-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplenishmentLoadState {
  readonly state = input.required<LoadState>();
  readonly retry = output<void>();
}

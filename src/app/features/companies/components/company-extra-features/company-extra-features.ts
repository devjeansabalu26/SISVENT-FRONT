import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyExtraFeatures, CompanyFeature } from '../../models/company-modules.model';

const DOMAIN_LABEL: Readonly<Record<string, string>> = {
  DASHBOARD: 'Dashboard',
  CATALOG: 'Catálogo',
  COMMERCIAL: 'Comercial',
  INVENTORY: 'Inventario',
  PROCUREMENT: 'Abastecimiento',
  ANALYTICS: 'Análisis',
  REPORTING: 'Reportes',
  SECURITY: 'Seguridad',
};

@Component({
  selector: 'app-company-extra-features',
  imports: [DateTimePipe],
  template: `
    <section class="surface-card extras">
      <header class="extras__head">
        <div>
          <h3>Funcionalidades extra</h3>
          <p>
            Habilita a esta empresa funcionalidades que su plan {{ data()?.planName ?? '' }} no incluye, por ejemplo para una prueba
            o un acuerdo especial. Se suman a las del plan mientras su plan esté vigente y se conservan si cambia de plan.
          </p>
        </div>
      </header>

      @if (loading()) {
        <p class="muted">Cargando funcionalidades…</p>
      } @else if (data()) {
        @if (!available().length) {
          <p class="muted">El plan de esta empresa ya incluye todas las funcionalidades.</p>
        } @else {
          @for (group of groups(); track group.label) {
            <h4 class="extras__group">{{ group.label }}</h4>
            <ul class="extras__list">
              @for (feature of group.features; track feature.code) {
                <li [class.is-on]="isOn(feature)">
                  <label>
                    <span class="extras__text">
                      <strong>{{ feature.name }}</strong>
                      <small>
                        @if (feature.extra && feature.grantedAt) {
                          Extra desde {{ feature.grantedAt | dateTime }}@if (feature.note) { · {{ feature.note }} }
                        } @else {
                          {{ feature.description ?? 'No incluida en el plan' }}
                        }
                      </small>
                    </span>
                    <input type="checkbox" role="switch" [checked]="isOn(feature)" [disabled]="saving()"
                      (change)="toggle(feature, $any($event.target).checked)" [attr.aria-label]="'Habilitar ' + feature.name" />
                  </label>
                </li>
              }
            </ul>
          }
          <label class="extras__note">
            Motivo (opcional)
            <input #note type="text" maxlength="300" placeholder="Ej.: prueba de 30 días, acuerdo comercial…" [disabled]="saving()" />
          </label>
          <footer class="extras__foot">
            <span>{{ pending().length ? pending().length + ' cambio(s) sin guardar' : included().length + ' en el plan · ' + extrasCount() + ' extra' }}</span>
            <button type="button" class="ghost" (click)="discard()" [disabled]="!pending().length || saving()">Descartar</button>
            <button type="button" class="primary" (click)="save(note.value)" [disabled]="!pending().length || saving()">
              {{ saving() ? 'Guardando…' : 'Guardar extras' }}
            </button>
          </footer>
        }
      }
    </section>
  `,
  styleUrls: ['../../../../shared/forms/switch.scss', '../company-modules-tab/company-modules-tab.scss'],
  styles: `
    .extras { margin-top: var(--space-md); display: flex; flex-direction: column; gap: 4px; }
    .extras__head h3 { margin: 0 0 4px; }
    .extras__head p { margin: 0 0 8px; max-width: 680px; color: var(--color-text-muted); font-size: 13px; }
    .extras__group { margin: 12px 0 4px; color: var(--color-text-secondary); font-size: var(--font-size-xs); text-transform: uppercase; }
    .extras__list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
    .extras__list li { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .extras__list li.is-on { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .extras__list label { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
    .extras__text { display: grid; gap: 2px; }
    .extras__text small { color: var(--color-text-muted); }
    .extras__note { display: grid; gap: 6px; margin-top: 12px; color: var(--color-text-secondary); font-size: var(--font-size-xs); font-weight: 600; }
    .extras__note input { height: var(--control-height); padding: 0 12px; }
    .extras__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 12px; }
    .extras__foot span { margin-right: auto; color: var(--color-text-muted); font-size: 13px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyExtraFeaturesPanel implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);

  readonly companyId = input.required<string>();
  readonly changed = output<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly data = signal<CompanyExtraFeatures | null>(null);
  readonly draft = signal<ReadonlyMap<string, boolean>>(new Map());

  readonly available = computed(() => (this.data()?.features ?? []).filter((feature) => !feature.inPlan));
  readonly included = computed(() => (this.data()?.features ?? []).filter((feature) => feature.inPlan));
  readonly extrasCount = computed(() => this.available().filter((feature) => feature.extra).length);
  readonly groups = computed(() => {
    const map = new Map<string, CompanyFeature[]>();
    for (const feature of this.available()) {
      const label = DOMAIN_LABEL[feature.domain] ?? feature.domain;
      map.set(label, [...(map.get(label) ?? []), feature]);
    }
    return [...map].map(([label, features]) => ({ label, features }));
  });
  readonly pending = computed(() => this.available().filter((feature) => this.draft().has(feature.code) && this.draft().get(feature.code) !== feature.extra));

  ngOnInit(): void {
    this.api.getExtraFeatures(this.companyId()).subscribe({
      next: (result) => this.apply(result),
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar las funcionalidades extra.', 'error');
      },
    });
  }

  isOn(feature: CompanyFeature): boolean {
    return this.draft().get(feature.code) ?? feature.extra;
  }

  toggle(feature: CompanyFeature, enabled: boolean): void {
    const next = new Map(this.draft());
    next.set(feature.code, enabled);
    this.draft.set(next);
  }

  discard(): void {
    this.draft.set(new Map());
  }

  save(note: string): void {
    if (!this.pending().length || this.saving()) return;
    const codes = this.available().filter((feature) => this.isOn(feature)).map((feature) => feature.code);
    this.saving.set(true);
    this.api.updateExtraFeatures(this.companyId(), codes, note.trim() || null).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.apply(result);
        this.changed.emit();
        this.notifications.show('Funcionalidades extra guardadas. La empresa las verá al recargar o volver a iniciar sesión.', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.notifications.show('No se pudieron guardar las funcionalidades extra.', 'error');
      },
    });
  }

  private apply(result: CompanyExtraFeatures): void {
    this.data.set(result);
    this.draft.set(new Map());
    this.loading.set(false);
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyModule, CompanyModules } from '../../models/company-modules.model';

interface ModuleGroup {
  readonly label: string;
  readonly modules: readonly CompanyModule[];
}

/** Agrupa por la sección del menú lateral, en el orden del catálogo. */
function groupModules(modules: readonly CompanyModule[]): readonly ModuleGroup[] {
  const groups = new Map<string, CompanyModule[]>();
  for (const module of modules) groups.set(module.group, [...(groups.get(module.group) ?? []), module]);
  return [...groups].map(([label, items]) => ({ label, modules: items }));
}

/**
 * Menús de la empresa (SUPERADMIN): activa o desactiva cada menú dentro de lo que incluye el plan vigente.
 * Un menú apagado desaparece para el ADMIN y sus vendedores, y el backend rechaza sus operaciones.
 */
@Component({
  selector: 'app-company-modules-tab',
  templateUrl: './company-modules-tab.html',
  styleUrls: ['../../../../shared/forms/switch.scss', './company-modules-tab.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyModulesTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);

  readonly companyId = input.required<string>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly data = signal<CompanyModules | null>(null);
  /** Cambios sin guardar: código → activo. */
  readonly draft = signal<ReadonlyMap<string, boolean>>(new Map());

  readonly groups = computed<readonly ModuleGroup[]>(() => groupModules(this.data()?.modules ?? []));

  readonly changes = computed(() =>
    (this.data()?.modules ?? []).filter((module) => this.draft().has(module.code) && this.draft().get(module.code) !== module.enabled),
  );
  readonly enabledCount = computed(() => (this.data()?.modules ?? []).filter((module) => this.isOn(module)).length);

  ngOnInit(): void {
    this.api.getModules(this.companyId()).subscribe({
      next: (result) => this.apply(result),
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar los menús de la empresa.', 'error');
      },
    });
  }

  isOn(module: CompanyModule): boolean {
    return this.draft().get(module.code) ?? module.enabled;
  }

  toggle(module: CompanyModule, enabled: boolean): void {
    const next = new Map(this.draft());
    next.set(module.code, enabled);
    this.draft.set(next);
  }

  /** Activa o apaga todos los menús que el plan permite. */
  setAll(enabled: boolean): void {
    const next = new Map<string, boolean>();
    for (const module of this.data()?.modules ?? []) if (module.includedInPlan) next.set(module.code, enabled);
    this.draft.set(next);
  }

  discard(): void {
    this.draft.set(new Map());
  }

  save(): void {
    const changes = this.changes().map((module) => ({ code: module.code, enabled: this.isOn(module) }));
    if (!changes.length || this.saving()) return;
    this.saving.set(true);
    this.api.updateModules(this.companyId(), changes).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.apply(result);
        this.notifications.show('Menús de la empresa actualizados. Los usuarios los verán al volver a iniciar sesión o recargar.', 'success');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.errorMessage(cause), 'error');
      },
    });
  }

  private apply(result: CompanyModules): void {
    this.data.set(result);
    this.draft.set(new Map());
    this.loading.set(false);
  }

  private errorMessage(cause: unknown): string {
    if (cause instanceof AppHttpError && cause.status === 400) {
      const body = (cause.originalError as { error?: { title?: unknown } } | undefined)?.error;
      if (typeof body?.title === 'string') return body.title;
    }
    return 'No se pudieron guardar los menús.';
  }
}

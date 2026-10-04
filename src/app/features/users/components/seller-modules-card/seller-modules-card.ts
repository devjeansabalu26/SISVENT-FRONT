import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ModuleLevel } from '../../../../core/auth/constants/module-permissions.constant';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { UserApiService } from '../../data-access/user-api.service';
import { SellerModule, SellerModules, UpdateSellerModules } from '../../models/seller-modules.model';

type Choice = ModuleLevel | 'NONE';

interface ModuleGroup {
  readonly label: string;
  readonly modules: readonly SellerModule[];
}

function groupModules(modules: readonly SellerModule[]): readonly ModuleGroup[] {
  const groups = new Map<string, SellerModule[]>();
  for (const module of modules) groups.set(module.group, [...(groups.get(module.group) ?? []), module]);
  return [...groups].map(([label, items]) => ({ label, modules: items }));
}

@Component({
  selector: 'app-seller-modules-card',
  templateUrl: './seller-modules-card.html',
  styleUrl: './seller-modules-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerModulesCard implements OnInit {
  private readonly api = inject(UserApiService);
  private readonly notifications = inject(NotificationService);

  readonly userId = input.required<string>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly data = signal<SellerModules | null>(null);
  readonly draft = signal<ReadonlyMap<string, Choice>>(new Map());

  readonly groups = computed(() => groupModules(this.data()?.modules ?? []));
  readonly dirty = computed(() =>
    (this.data()?.modules ?? []).some((module) => this.choiceOf(module) !== (module.level ?? 'NONE')),
  );
  readonly assignedCount = computed(() =>
    (this.data()?.modules ?? []).filter((module) => this.choiceOf(module) !== 'NONE').length,
  );

  ngOnInit(): void {
    this.api.getModules(this.userId()).subscribe({
      next: (result) => this.apply(result),
      error: () => {
        this.loading.set(false);
        this.notifications.show('No se pudieron cargar los menús del vendedor.', 'error');
      },
    });
  }

  choiceOf(module: SellerModule): Choice {
    return this.draft().get(module.code) ?? module.level ?? 'NONE';
  }

  choose(module: SellerModule, choice: Choice): void {
    const next = new Map(this.draft());
    next.set(module.code, choice);
    this.draft.set(next);
  }

  discard(): void {
    this.draft.set(new Map());
  }

  save(): void {
    const modules = (this.data()?.modules ?? [])
      .filter((module) => module.availableInCompany)
      .map((module) => ({ code: module.code, level: this.choiceOf(module) }))
      .filter((item): item is { code: string; level: ModuleLevel } => item.level !== 'NONE');
    this.submit({ useDefaults: false, modules });
  }

  restoreDefaults(): void {
    this.submit({ useDefaults: true, modules: [] });
  }

  private submit(body: UpdateSellerModules): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api.updateModules(this.userId(), body).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.apply(result);
        this.notifications.show('Menús del vendedor actualizados. Los verá al volver a iniciar sesión o recargar.', 'success');
      },
      error: (cause: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.errorMessage(cause), 'error');
      },
    });
  }

  private apply(result: SellerModules): void {
    this.data.set(result);
    this.draft.set(new Map());
    this.loading.set(false);
  }

  private errorMessage(cause: unknown): string {
    if (cause instanceof AppHttpError && cause.status === 400) {
      const body = (cause.originalError as { error?: { title?: unknown } } | undefined)?.error;
      if (typeof body?.title === 'string') return body.title;
    }
    return 'No se pudieron guardar los menús del vendedor.';
  }
}

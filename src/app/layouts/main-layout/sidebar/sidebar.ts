import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { AppRole } from '../../../core/auth/constants/app-role.constant';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { MAIN_NAVIGATION } from '../navigation/navigation.config';
import { NavigationGroup, SidebarItem } from '../navigation/navigation-item.model';

const ROLE_LABEL: Readonly<Record<AppRole, string>> = {
  SUPERADMIN: 'Superadministrador',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly compact = input(false);
  readonly navigate = output<void>();
  readonly company = inject(CompanyContextService).company;
  private readonly access = inject(AccessControlService);
  private readonly users = inject(UserContextService);

  /** Nombre mostrado arriba del sidebar: la empresa real del usuario, o "SISVENT" para SUPERADMIN
   * (sin empresa) — nunca un nombre de empresa de ejemplo. */
  readonly brandName = computed(() => this.company()?.commercialName ?? 'SISVENT');
  readonly brandInitial = computed(() => this.brandName().trim().charAt(0).toUpperCase() || 'S');
  readonly roleLabel = computed(() => {
    const role = this.users.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });

  /** Visibles por rol/permiso; los que el plan no incluye se muestran con candado (no se ocultan). */
  private readonly items = computed<readonly SidebarItem[]>(() =>
    MAIN_NAVIGATION.filter((item) => this.access.canAccess({ roles: item.roles, permissions: item.permissions, plans: item.plans })).map(
      (item) => ({ ...item, locked: this.access.isLockedByPlan({ ...item, feature: item.requiredFeature }) }),
    ),
  );

  /** Groups visible items by their `group` label, preserving first-seen order. */
  readonly groups = computed<readonly NavigationGroup[]>(() => {
    const byLabel = new Map<string | null, SidebarItem[]>();
    for (const item of this.items()) {
      const label = item.group ?? null;
      const bucket = byLabel.get(label) ?? [];
      bucket.push(item);
      byLabel.set(label, bucket);
    }
    return [...byLabel].map(([label, items]) => ({ label, items }));
  });
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
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
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
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
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly openGroups = signal<ReadonlySet<string>>(new Set());

  readonly brandName = computed(() => this.company()?.commercialName ?? 'SAVIX');
  readonly brandInitial = computed(() => this.brandName().trim().charAt(0).toUpperCase() || 'S');
  readonly roleLabel = computed(() => {
    const role = this.users.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });

  private readonly items = computed<readonly SidebarItem[]>(() =>
    MAIN_NAVIGATION.filter((item) => this.access.canAccess({ roles: item.roles, permissions: item.permissions, plans: item.plans })).map(
      (item) => ({ ...item, locked: this.access.isLockedByPlan({ ...item, feature: item.requiredFeature }) }),
    ),
  );

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

  readonly activeGroup = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    let best: SidebarItem | null = null;
    for (const item of this.items()) {
      const matches = path === item.route || path.startsWith(item.route + '/');
      if (matches && (!best || item.route.length > best.route.length)) best = item;
    }
    return best?.group ?? null;
  });

  constructor() {
    effect(() => {
      const active = this.activeGroup();
      if (active) this.openGroups.update((open) => (open.has(active) ? open : new Set(open).add(active)));
    });
  }

  isOpen(label: string): boolean {
    return this.openGroups().has(label);
  }

  toggleGroup(label: string): void {
    this.openGroups.update((open) => {
      const next = new Set(open);
      if (!next.delete(label)) next.add(label);
      return next;
    });
  }
}

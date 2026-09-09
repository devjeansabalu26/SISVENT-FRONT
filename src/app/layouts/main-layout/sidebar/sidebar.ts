import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { MAIN_NAVIGATION } from '../navigation/navigation.config';
import { NavigationGroup, NavigationItem } from '../navigation/navigation-item.model';

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

  private readonly items = computed(() => MAIN_NAVIGATION.filter((item) => this.access.canAccess(item)));

  /** Groups visible items by their `group` label, preserving first-seen order. */
  readonly groups = computed<readonly NavigationGroup[]>(() => {
    const byLabel = new Map<string | null, NavigationItem[]>();
    for (const item of this.items()) {
      const label = item.group ?? null;
      const bucket = byLabel.get(label) ?? [];
      bucket.push(item);
      byLabel.set(label, bucket);
    }
    return [...byLabel].map(([label, items]) => ({ label, items }));
  });
}

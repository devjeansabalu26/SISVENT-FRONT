import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { AppSessionService } from '../../../core/auth/services/app-session.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';
import { NotificationBadgeService } from '../../../features/notifications/data-access/notification-badge.service';

@Component({ selector: 'app-header', imports: [RouterLink], templateUrl: './header.html', styleUrl: './header.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class Header implements OnInit {
  private readonly session = inject(AppSessionService);
  private readonly router = inject(Router);
  readonly menuToggle = output<void>();
  readonly user = inject(UserContextService).user;
  readonly company = inject(CompanyContextService).company;
  private readonly badge = inject(NotificationBadgeService);
  private readonly destroyRef = inject(DestroyRef);
  /** Campana conectada al centro de notificaciones (mismo permiso que la ruta). */
  readonly canSeeNotifications = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.notificationsView] });
  readonly unread = this.badge.unread;
  readonly bellLabel = computed(() => (this.unread() ? `Notificaciones: ${this.unread()} sin leer` : 'Notificaciones'));

  ngOnInit(): void {
    if (!this.canSeeNotifications) return;
    this.badge.refresh();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.badge.refresh());
  }

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/login');
  }
}

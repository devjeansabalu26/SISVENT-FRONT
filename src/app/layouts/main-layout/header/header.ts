import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { AppSessionService } from '../../../core/auth/services/app-session.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { CompanyContextService } from '../../../core/context/company-context/company-context.service';

@Component({ selector: 'app-header', templateUrl: './header.html', styleUrl: './header.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class Header {
  private readonly session = inject(AppSessionService);
  private readonly router = inject(Router);
  readonly menuToggle = output<void>();
  readonly user = inject(UserContextService).user;
  readonly company = inject(CompanyContextService).company;

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/login');
  }
}

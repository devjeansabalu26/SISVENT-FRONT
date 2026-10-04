import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { UserFormDialog } from '../components/user-form-dialog/user-form-dialog';
import { SellerModulesCard } from '../components/seller-modules-card/seller-modules-card';
import { PlatformUserApiService } from '../data-access/platform-user-api.service';
import { UserApiService } from '../data-access/user-api.service';
import { AppUser, UserFormValue } from '../models/user.model';

interface UserDetailView {
  readonly id: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: string;
  readonly companyName: string | null;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
  readonly createdAt: string | null;
  readonly editable: AppUser | null;
}

@Component({
  selector: 'app-user-detail-page',
  imports: [PageHeader, StatusChip, RouterLink, DatePipe, SellerModulesCard],
  templateUrl: './user-detail-page.html',
  styleUrls: ['../../../shared/ui/detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(UserApiService);
  private readonly platformApi = inject(PlatformUserApiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly isSuperadmin = inject(UserContextService).user()?.role === 'SUPERADMIN';

  readonly loading = signal(true);
  readonly user = signal<UserDetailView | null>(null);

  readonly fields = computed(() => {
    const user = this.user();
    if (!user) return [];
    return [
      { label: 'Correo electrónico', value: user.email ?? '—' },
      { label: 'Teléfono', value: user.phone ?? '—' },
      { label: 'Documento', value: user.document ?? '—' },
      { label: 'Rol', value: user.role },
      ...(this.isSuperadmin ? [{ label: 'Empresa', value: user.companyName ?? '—' }] : []),
      { label: 'Local asignado', value: user.storeName ?? '—' },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    if (this.isSuperadmin) {
      this.platformApi.get(this.id).subscribe({
        next: (detail) => {
          this.user.set({
            id: detail.profileId,
            fullName: `${detail.firstName} ${detail.lastName}`.trim(),
            email: detail.email,
            phone: detail.phone,
            document: detail.document,
            role: detail.role,
            companyName: detail.companyName,
            storeName: detail.storeName,
            isActive: detail.isActive,
            lastActivityAt: detail.lastActivityAt,
            createdAt: detail.createdAt,
            editable: null,
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }
    this.api.get(this.id).subscribe({
      next: (detail) => {
        this.user.set({
          id: detail.id,
          fullName: `${detail.firstName} ${detail.lastName}`.trim(),
          email: detail.email,
          phone: detail.phone,
          document: detail.document,
          role: detail.role,
          companyName: null,
          storeName: detail.storeName,
          isActive: detail.isActive,
          lastActivityAt: detail.lastActivityAt,
          createdAt: detail.createdAt,
          editable: {
            id: detail.id,
            fullName: `${detail.firstName} ${detail.lastName}`.trim(),
            email: detail.email,
            phone: detail.phone,
            document: detail.document,
            role: detail.role,
            storeId: detail.storeId,
            storeName: detail.storeName,
            isActive: detail.isActive,
            lastActivityAt: detail.lastActivityAt,
          },
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  edit(): void {
    const editable = this.user()?.editable;
    if (!editable) return;
    this.dialog
      .open<UserFormDialog, AppUser | null, UserFormValue>(UserFormDialog, { data: editable })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        this.api.update(editable.id, value).subscribe({
          next: () => {
            this.notifications.show('Usuario actualizado.', 'success');
            this.load();
          },
          error: (cause: unknown) => {
            const message =
              cause instanceof AppHttpError && cause.status === 409
                ? 'Conflicto: alcanzaste el límite del plan o el correo ya existe.'
                : 'No se pudo actualizar el usuario.';
            this.notifications.show(message, 'error');
          },
        });
      });
  }
}

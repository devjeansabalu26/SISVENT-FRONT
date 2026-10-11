import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, Subject, debounceTime, filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CredentialDialog } from '../../../shared/ui/credential-dialog/credential-dialog';
import { ReviewDialog } from '../../../shared/ui/review-dialog/review-dialog';
import { resetCredential, resetPasswordReview, userStatusReview } from '../../../shared/ui/review-dialog/status-reviews';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn, DataTableMenuAction } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { UserFormDialog } from '../components/user-form-dialog/user-form-dialog';
import { PlatformUserApiService } from '../data-access/platform-user-api.service';
import { UserApiService } from '../data-access/user-api.service';
import { AppUser, PlatformUserItem, UserFormValue, UserRoleLimit } from '../models/user.model';

interface Row { readonly id: string; readonly fullName: string; readonly userCode: string | null; readonly email: string | null; readonly document: string | null; readonly role: string; readonly storeName: string | null; readonly companyName?: string | null; readonly isActive: boolean }

@Component({
  selector: 'app-user-list-page',
  imports: [DataTable, PageHeader, Paginator],
  templateUrl: './user-list-page.html',
  styleUrl: './user-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(UserApiService);
  private readonly platformApi = inject(PlatformUserApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isSuperadmin = inject(UserContextService).user()?.role === 'SUPERADMIN';

  readonly menuActions: readonly DataTableMenuAction[] = [
    { id: 'toggle', label: 'Activar / desactivar', icon: 'power_settings_new' },
    { id: 'copy-id', label: 'Copiar ID', icon: 'badge' },
    { id: 'copy-email', label: 'Copiar correo', icon: 'mail' },
  ];

  readonly loading = signal(false);
  readonly query = signal('');
  readonly role = signal('');
  readonly status = signal('');
  readonly limits = signal<UserRoleLimit | null>(null);
  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly Row[]>([]);
  private readonly users = signal<readonly AppUser[]>([]);

  private readonly search$ = new Subject<void>();

  private toRow(u: AppUser | PlatformUserItem): Row {
    return 'profileId' in u
      ? {
          id: u.profileId,
          fullName: u.fullName,
          userCode: u.userCode ?? null,
          email: u.email,
          document: u.document,
          role: u.role,
          storeName: u.storeName,
          companyName: u.companyName,
          isActive: u.isActive,
        }
      : {
          id: u.id,
          fullName: u.fullName,
          userCode: u.userCode ?? null,
          email: u.email,
          document: u.document,
          role: u.role,
          storeName: u.storeName,
          isActive: u.isActive,
        };
  }

  private get isActiveFilter(): boolean | undefined {
    return this.status() ? this.status() === 'ACTIVE' : undefined;
  }

  readonly columns: readonly DataTableColumn<Row>[] = this.isSuperadmin
    ? [
        { key: 'name', label: 'Nombre', value: (row) => row.fullName },
        { key: 'code', label: 'Usuario', value: (row) => row.userCode ?? '—' },
        { key: 'email', label: 'Correo', value: (row) => row.email ?? '—' },
        { key: 'role', label: 'Rol', value: (row) => row.role },
        { key: 'company', label: 'Empresa', value: (row) => row.companyName ?? '—' },
        { key: 'store', label: 'Local', value: (row) => row.storeName ?? '—' },
        { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
      ]
    : [
        { key: 'name', label: 'Nombre', value: (row) => row.fullName },
        { key: 'code', label: 'Usuario', value: (row) => row.userCode ?? '—' },
        { key: 'email', label: 'Correo', value: (row) => row.email ?? '—' },
        { key: 'document', label: 'Documento', value: (row) => row.document ?? '—' },
        { key: 'role', label: 'Rol', value: (row) => row.role },
        { key: 'store', label: 'Local', value: (row) => row.storeName ?? '—' },
        { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
      ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const common = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize,
      search: this.query().trim() || undefined,
      role: this.role() || undefined,
      isActive: this.isActiveFilter,
    };
    if (this.isSuperadmin) {
      this.platformApi.list(common).subscribe({
        next: (page) => {
          this.rows.set(page.items.map((u) => this.toRow(u)));
          this.total.set(page.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }
    this.api.list(common).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.rows.set(response.items.map((u) => this.toRow(u)));
        this.total.set(response.totalCount);
        this.limits.set(response.limits);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.pageNumber.set(1);
    this.search$.next();
  }

  onRoleChange(value: string): void {
    this.role.set(value);
    this.pageNumber.set(1);
    this.load();
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.pageNumber.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  create(): void {
    if (this.isSuperadmin) {
      this.notifications.show('Crear usuarios de otra empresa se gestiona desde el detalle de esa empresa (Empresas).', 'info');
      return;
    }
    this.openForm(null);
  }

  edit(row: Row): void {
    if (this.isSuperadmin) return;
    const user = this.users().find((u) => u.id === row.id) ?? null;
    this.openForm(user);
  }

  view(row: Row): void {
    void this.router.navigate(['/app/users', row.id]);
  }

  onMenuAction(event: { action: string; row: Row }): void {
    switch (event.action) {
      case 'toggle':
        this.toggle(event.row);
        return;
      case 'copy-id':
        this.copy(event.row.id, 'ID copiado al portapapeles.');
        return;
      case 'copy-email':
        if (!event.row.email) {
          this.notifications.show('El usuario no tiene un correo registrado.', 'info');
          return;
        }
        this.copy(event.row.email, 'Correo copiado al portapapeles.');
        return;
    }
  }

  private copy(text: string, message: string): void {
    navigator.clipboard.writeText(text).then(
      () => this.notifications.show(message, 'success'),
      () => this.notifications.show('No se pudo copiar al portapapeles.', 'error'),
    );
  }

  changePassword(row: Row): void {
    this.dialog
      .open(ReviewDialog, { data: resetPasswordReview(row.fullName) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        const request: Observable<{ readonly temporaryPassword: string; readonly userCode?: string | null }> = this.isSuperadmin
          ? this.platformApi.resetAccess(row.id)
          : this.api.resetAccess(row.id);
        request.subscribe({
          next: (result) => {
            this.dialog.open(CredentialDialog, {
              data: resetCredential(result.userCode ?? row.userCode ?? row.fullName, result.temporaryPassword),
              disableClose: true,
            });
          },
          error: () => this.notifications.show('No se pudo generar la contraseña temporal.', 'error'),
        });
      });
  }

  toggle(row: Row): void {
    if (this.isSuperadmin) {
      this.notifications.show('El cambio de estado de usuarios de otra empresa se gestiona desde Empresas.', 'info');
      return;
    }
    const deactivate = row.isActive;
    this.dialog
      .open(ReviewDialog, { data: userStatusReview(row, deactivate) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        const request = deactivate ? this.api.deactivate(row.id) : this.api.activate(row.id);
        request.subscribe({
          next: () => {
            this.notifications.show(`Usuario ${deactivate ? 'desactivado' : 'activado'} correctamente.`, 'success');
            this.load();
          },
          error: () => this.notifications.show('No se pudo actualizar el estado del usuario.', 'error'),
        });
      });
  }

  private openForm(user: AppUser | null): void {
    this.dialog
      .open<UserFormDialog, AppUser | null, UserFormValue>(UserFormDialog, { data: user })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        const onError = (cause: unknown) => {
          const message =
            cause instanceof AppHttpError && cause.status === 409
              ? 'Conflicto: alcanzaste el límite del plan o el correo ya existe.'
              : `No se pudo ${user ? 'actualizar' : 'crear'} el usuario.`;
          this.notifications.show(message, 'error');
        };
        if (user) {
          this.api.update(user.id, value).subscribe({
            next: () => {
              this.notifications.show('Usuario actualizado.', 'success');
              this.load();
            },
            error: onError,
          });
        } else {
          this.api.create(value).subscribe({
            next: (result) => {
              this.dialog.open(CredentialDialog, {
                data: {
                  ...resetCredential(result.user.userCode ?? result.user.email ?? '', result.temporaryPassword),
                  title: 'Usuario creado',
                  successMessage: 'Entrega estas credenciales al usuario: inicia sesión con su usuario y su clave de 5 dígitos.',
                },
                disableClose: true,
              });
              this.load();
            },
            error: onError,
          });
        }
      });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { UserFormDialog } from '../components/user-form-dialog/user-form-dialog';
import { USER_MOCK } from '../data-access/user.mock';
import { UserFormValue, UserListItem } from '../models/user.model';

@Component({ selector: 'app-user-list-page', imports: [DataTable, PageHeader], templateUrl: './user-list-page.html', styleUrl: './user-list-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class UserListPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly users = signal<readonly UserListItem[]>(USER_MOCK);
  readonly query = signal('');
  readonly role = signal('');
  readonly status = signal('');
  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.users().filter((user) => `${user.fullName} ${user.email} ${user.document}`.toLowerCase().includes(query) && (!this.role() || user.role === this.role()) && (!this.status() || user.status === this.status()));
  });
  readonly columns: readonly DataTableColumn<UserListItem>[] = [
    { key: 'name', label: 'Usuario', value: (row) => row.fullName },
    { key: 'email', label: 'Correo', value: (row) => row.email },
    { key: 'document', label: 'Documento', value: (row) => row.document },
    { key: 'role', label: 'Rol', value: (row) => row.role },
    { key: 'branch', label: 'Sucursal', value: (row) => row.branch },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  create(): void { this.openForm(null); }
  edit(user: UserListItem): void { this.openForm(user); }

  toggle(user: UserListItem): void {
    const deactivate = user.status === 'ACTIVE';
    this.dialog.open(ConfirmDialog, { data: { title: `${deactivate ? 'Desactivar' : 'Activar'} usuario`, message: `${user.fullName} quedará ${deactivate ? 'sin acceso al sistema' : 'habilitado para iniciar sesión'}.`, confirmLabel: deactivate ? 'Desactivar' : 'Activar', destructive: deactivate } }).afterClosed().pipe(filter(Boolean)).subscribe(() => {
      this.users.update((users) => users.map((item) => item.id === user.id ? { ...item, status: deactivate ? 'INACTIVE' : 'ACTIVE' } : item));
      this.notifications.show(`Usuario ${deactivate ? 'desactivado' : 'activado'} correctamente.`, 'success');
    });
  }

  private openForm(user: UserListItem | null): void {
    this.dialog.open<UserFormDialog, UserListItem | null, UserFormValue>(UserFormDialog, { data: user }).afterClosed().subscribe((value) => {
      if (!value) return;
      if (user) this.users.update((users) => users.map((item) => item.id === user.id ? { id: user.id, ...value } : item));
      else this.users.update((users) => [...users, { id: globalThis.crypto.randomUUID(), ...value }]);
      this.notifications.show(`Usuario ${user ? 'actualizado' : 'creado'} correctamente.`, 'success');
    });
  }
}

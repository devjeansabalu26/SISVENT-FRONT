import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, debounceTime, filter } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { CredentialDialog } from '../../../../shared/ui/credential-dialog/credential-dialog';
import { ReviewDialog } from '../../../../shared/ui/review-dialog/review-dialog';
import { resetCredential, resetPasswordReview, userStatusReview } from '../../../../shared/ui/review-dialog/status-reviews';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../../shared/ui/data-table/data-table.model';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { formatDateTime } from '../../../../shared/utils/date-format';
import { PlatformUserApiService } from '../../../users/data-access/platform-user-api.service';
import { CompanyApiService } from '../../data-access/company-api.service';

interface Row {
  readonly id: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly document: string | null;
  readonly role: string;
  readonly storeName: string | null;
  readonly isActive: boolean;
  readonly lastActivityAt: string | null;
}

@Component({
  selector: 'app-company-users-tab',
  imports: [DataTable, Paginator],
  templateUrl: './company-users-tab.html',
  styleUrl: '../../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyUsersTab implements OnInit {
  private readonly api = inject(PlatformUserApiService);
  private readonly companyApi = inject(CompanyApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = input.required<string>();

  readonly loading = signal(false);
  readonly query = signal('');
  readonly role = signal('');
  readonly storeId = signal('');
  readonly status = signal('');
  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly Row[]>([]);
  readonly stores = signal<readonly { readonly id: string; readonly name: string }[]>([]);

  private readonly search$ = new Subject<void>();

  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'name', label: 'Nombre', value: (row) => row.fullName },
    { key: 'email', label: 'Correo', value: (row) => row.email ?? '—' },
    { key: 'role', label: 'Rol', value: (row) => row.role },
    { key: 'store', label: 'Local', value: (row) => row.storeName ?? '—' },
    { key: 'phone', label: 'Teléfono', value: (row) => row.phone ?? '—' },
    { key: 'document', label: 'Documento', value: (row) => row.document ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
    { key: 'lastActivity', label: 'Última actividad', value: (row) => formatDateTime(row.lastActivityAt) },
  ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.companyApi
      .getStores(this.companyId())
      .subscribe((result) => this.stores.set(result.items.map((s) => ({ id: s.id, name: s.name }))));
    this.load();
  }

  private get isActiveFilter(): boolean | undefined {
    return this.status() ? this.status() === 'ACTIVE' : undefined;
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({
        companyId: this.companyId(),
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize,
        search: this.query().trim() || undefined,
        role: this.role() || undefined,
        storeId: this.storeId() || undefined,
        isActive: this.isActiveFilter,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(
            page.items.map((u) => ({
              id: u.profileId,
              fullName: u.fullName,
              email: u.email,
              phone: u.phone,
              document: u.document,
              role: u.role,
              storeName: u.storeName,
              isActive: u.isActive,
              lastActivityAt: u.lastActivityAt,
            })),
          );
          this.total.set(page.totalCount);
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

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  view(row: Row): void {
    void this.router.navigate(['/app/users', row.id]);
  }

  onMenuAction(event: { action: string; row: Row }): void {
    if (event.action === 'toggle') this.toggle(event.row);
    if (event.action === 'reset') this.resetAccess(event.row);
  }

  private toggle(row: Row): void {
    const deactivate = row.isActive;
    this.dialog
      .open(ReviewDialog, { data: userStatusReview(row, deactivate) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.setStatus(row.id, !deactivate, `${deactivate ? 'Desactivado' : 'Activado'} desde el detalle de la empresa.`).subscribe({
          next: () => {
            this.notifications.show(`Usuario ${deactivate ? 'desactivado' : 'activado'} correctamente.`, 'success');
            this.load();
          },
          error: () => this.notifications.show('No se pudo actualizar el estado del usuario.', 'error'),
        });
      });
  }

  private resetAccess(row: Row): void {
    this.dialog
      .open(ReviewDialog, { data: resetPasswordReview(row.fullName) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.resetAccess(row.id).subscribe({
          next: (result) =>
            this.dialog.open(CredentialDialog, {
              data: resetCredential(row.email ?? row.fullName, result.temporaryPassword),
              disableClose: true,
            }),
          error: () => this.notifications.show('No se pudo generar la contraseña temporal.', 'error'),
        });
      });
  }
}

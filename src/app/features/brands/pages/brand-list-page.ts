import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { BrandFormDialog } from '../components/brand-form-dialog/brand-form-dialog';
import { BrandApiService } from '../data-access/brand-api.service';
import { Brand, BrandFormValue } from '../models/brand.model';

@Component({
  selector: 'app-brand-list-page',
  imports: [DataTable, PageHeader],
  templateUrl: './brand-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandListPage implements OnInit {
  private readonly api = inject(BrandApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal('');
  private readonly brands = signal<readonly Brand[]>([]);

  /** Menú con nivel Gestionar (ADMIN o vendedor al que el ADMIN se lo asignó). */
  readonly canManage = computed(() => this.access.canAccess({ permissions: [APP_PERMISSIONS.brandsManage] }));
  private readonly access = inject(AccessControlService);

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.brands().filter((brand) => {
      const matchesTerm = !term || `${brand.name} ${brand.description ?? ''}`.toLowerCase().includes(term);
      const matchesStatus = !status || (status === 'ACTIVE' ? brand.isActive : !brand.isActive);
      return matchesTerm && matchesStatus;
    });
  });

  readonly columns: readonly DataTableColumn<Brand>[] = [
    { key: 'name', label: 'Nombre', value: (row) => row.name },
    { key: 'description', label: 'Descripción', value: (row) => row.description ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.brands.set(page.items);
        this.loading.set(false);
      },
      error: (cause: unknown) => {
        this.loading.set(false);
        this.notifications.show(this.messageFor(cause, 'No se pudieron cargar las marcas.'), 'error');
      },
    });
  }

  create(): void {
    this.openForm(null);
  }

  edit(brand: Brand): void {
    this.openForm(brand);
  }

  remove(brand: Brand): void {
    if (!brand.isActive) {
      this.notifications.show('La marca ya está inactiva.', 'info');
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Desactivar marca',
          message: `"${brand.name}" dejará de estar disponible para nuevos productos. Los productos existentes se conservan.`,
          confirmLabel: 'Desactivar',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.deactivate(brand.id, brand.version).subscribe({
          next: () => {
            this.notifications.show('Marca desactivada.', 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(this.messageFor(cause, 'No se pudo desactivar la marca.'), 'error');
            if (cause instanceof AppHttpError && cause.status === 409) this.load();
          },
        });
      });
  }

  private openForm(brand: Brand | null): void {
    this.dialog
      .open<BrandFormDialog, Brand | null, BrandFormValue>(BrandFormDialog, { data: brand })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        const request = brand
          ? this.api.update(brand.id, { ...value, version: brand.version })
          : this.api.create(value);
        request.subscribe({
          next: () => {
            this.notifications.show(`Marca ${brand ? 'actualizada' : 'creada'}.`, 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(
              this.messageFor(cause, `No se pudo ${brand ? 'actualizar' : 'crear'} la marca.`),
              'error',
            );
            if (cause instanceof AppHttpError && cause.status === 409) this.load();
          },
        });
      });
  }

  private messageFor(cause: unknown, fallback: string): string {
    if (cause instanceof AppHttpError) {
      if (cause.status === 409) return 'Conflicto: el registro cambió o el nombre ya existe. Se recargó la lista.';
      if (cause.status === 403) return 'No tienes permiso para gestionar marcas.';
      if (cause.status === 400) return 'Revisa los datos ingresados.';
    }
    return fallback;
  }
}

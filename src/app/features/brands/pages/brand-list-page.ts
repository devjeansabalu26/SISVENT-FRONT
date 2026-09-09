import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { BrandFormDialog } from '../components/brand-form-dialog/brand-form-dialog';
import { BRAND_MOCK } from '../data-access/brand.mock';
import { BrandFormValue, BrandListItem } from '../models/brand.model';

@Component({
  selector: 'app-brand-list-page',
  imports: [DataTable, PageHeader],
  templateUrl: './brand-list-page.html',
  styleUrl: '../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandListPage {
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly userContext = inject(UserContextService);

  readonly search = signal('');
  readonly statusFilter = signal('');
  private readonly brands = signal<readonly BrandListItem[]>(BRAND_MOCK);

  readonly canManage = computed(() => this.userContext.user()?.role === 'ADMIN');

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.brands().filter((brand) => {
      const matchesTerm = !term || `${brand.name} ${brand.description}`.toLowerCase().includes(term);
      const matchesStatus = !status || brand.status === status;
      return matchesTerm && matchesStatus;
    });
  });

  readonly columns: readonly DataTableColumn<BrandListItem>[] = [
    { key: 'name', label: 'Nombre', value: (row) => row.name },
    { key: 'description', label: 'Descripción', value: (row) => row.description || '—' },
    { key: 'categories', label: 'Categorías', value: (row) => row.categories.join(', ') || '—' },
    { key: 'productCount', label: 'Productos', value: (row) => row.productCount },
    { key: 'status', label: 'Estado', value: (row) => row.status, type: 'status' },
  ];

  create(): void {
    this.openForm(null);
  }

  edit(brand: BrandListItem): void {
    this.openForm(brand);
  }

  remove(brand: BrandListItem): void {
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
        this.brands.update((rows) =>
          rows.map((row) => (row.id === brand.id ? { ...row, status: 'INACTIVE' as const } : row)),
        );
        this.notifications.show('Marca desactivada.', 'success');
      });
  }

  private openForm(brand: BrandListItem | null): void {
    this.dialog
      .open<BrandFormDialog, BrandListItem | null, BrandFormValue>(BrandFormDialog, { data: brand })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        if (brand) {
          this.brands.update((rows) =>
            rows.map((row) =>
              row.id === brand.id
                ? { ...row, name: value.name, description: value.description, categories: value.categories, status: value.isActive ? 'ACTIVE' : 'INACTIVE' }
                : row,
            ),
          );
        } else {
          this.brands.update((rows) => [
            {
              id: crypto.randomUUID(),
              name: value.name,
              description: value.description,
              categories: value.categories,
              productCount: 0,
              status: value.isActive ? 'ACTIVE' : 'INACTIVE',
            },
            ...rows,
          ]);
        }
        this.notifications.show(`Marca ${brand ? 'actualizada' : 'creada'}.`, 'success');
      });
  }
}

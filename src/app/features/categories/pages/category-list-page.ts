import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { CategoryFormDialog } from '../components/category-form-dialog/category-form-dialog';
import { CategoryApiService } from '../data-access/category-api.service';
import { Category, CategoryFormValue } from '../models/category.model';

type CategoryView = 'cards' | 'table';
const VIEW_STORAGE_KEY = 'sisvent.categories.view';

function readStoredView(): CategoryView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
}

@Component({
  selector: 'app-category-list-page',
  imports: [DataTable, PageHeader, StatusChip],
  templateUrl: './category-list-page.html',
  styleUrl: './category-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListPage implements OnInit {
  private readonly api = inject(CategoryApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly userContext = inject(UserContextService);

  readonly loading = signal(false);
  readonly search = signal('');
  private readonly categories = signal<readonly Category[]>([]);

  /** Figma `ad-categorias` presenta tarjetas; la tabla queda como vista alternativa (se recuerda por navegador). */
  readonly view = signal<CategoryView>(readStoredView());

  readonly canManage = computed(() => this.userContext.user()?.role === 'ADMIN');

  readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter((category) =>
      `${category.name} ${category.description ?? ''}`.toLowerCase().includes(term),
    );
  });

  readonly columns: readonly DataTableColumn<Category>[] = [
    { key: 'name', label: 'Nombre', value: (row) => row.name },
    { key: 'description', label: 'Descripción', value: (row) => row.description ?? '—' },
    { key: 'status', label: 'Estado', value: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'), type: 'status' },
  ];

  setView(view: CategoryView): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // Almacenamiento no disponible (modo privado): la preferencia solo dura la sesión.
    }
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ pageSize: 100 }).subscribe({
      next: (page) => {
        this.categories.set(page.items);
        this.loading.set(false);
      },
      error: (cause: unknown) => {
        this.loading.set(false);
        this.notifications.show(this.messageFor(cause, 'No se pudieron cargar las categorías.'), 'error');
      },
    });
  }

  create(): void {
    this.openForm(null);
  }

  edit(category: Category): void {
    this.openForm(category);
  }

  remove(category: Category): void {
    if (!category.isActive) {
      this.notifications.show('La categoría ya está inactiva.', 'info');
      return;
    }
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Desactivar categoría',
          message: `"${category.name}" dejará de estar disponible para nuevos productos. Los productos existentes se conservan.`,
          confirmLabel: 'Desactivar',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.api.deactivate(category.id, category.version).subscribe({
          next: () => {
            this.notifications.show('Categoría desactivada.', 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(this.messageFor(cause, 'No se pudo desactivar la categoría.'), 'error');
            if (cause instanceof AppHttpError && cause.status === 409) this.load();
          },
        });
      });
  }

  private openForm(category: Category | null): void {
    this.dialog
      .open<CategoryFormDialog, Category | null, CategoryFormValue>(CategoryFormDialog, { data: category })
      .afterClosed()
      .subscribe((value) => {
        if (!value) return;
        const request = category
          ? this.api.update(category.id, { ...value, version: category.version })
          : this.api.create(value);
        request.subscribe({
          next: () => {
            this.notifications.show(`Categoría ${category ? 'actualizada' : 'creada'}.`, 'success');
            this.load();
          },
          error: (cause: unknown) => {
            this.notifications.show(
              this.messageFor(cause, `No se pudo ${category ? 'actualizar' : 'crear'} la categoría.`),
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
      if (cause.status === 403) return 'No tienes permiso para gestionar categorías.';
      if (cause.status === 400) return 'Revisa los datos ingresados.';
    }
    return fallback;
  }
}

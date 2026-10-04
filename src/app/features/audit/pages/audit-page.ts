import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime } from 'rxjs';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CompanyApiService } from '../../companies/data-access/company-api.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../shared/ui/paginator/paginator';
import { AuditDetailDialog } from '../components/audit-detail-dialog/audit-detail-dialog';
import { AuditApiService } from '../data-access/audit-api.service';
import { AuditEvent } from '../models/audit-event.model';

@Component({
  selector: 'app-audit-page',
  imports: [DataTable, PageHeader, Paginator],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPage implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly companyApi = inject(CompanyApiService);
  private readonly dialog = inject(MatDialog);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isSuperadmin = inject(UserContextService).user()?.role === 'SUPERADMIN';

  readonly loading = signal(false);
  readonly exporting = signal(false);

  readonly query = signal('');
  readonly level = signal('');
  readonly companyId = signal('');
  readonly from = signal('');
  readonly to = signal('');

  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly AuditEvent[]>([]);
  readonly companies = signal<readonly { readonly id: string; readonly name: string }[]>([]);

  private readonly search$ = new Subject<void>();

  readonly columns: readonly DataTableColumn<AuditEvent>[] = [
    { key: 'date', label: 'Fecha / hora', value: (row) => new Date(row.createdAt).toLocaleString('es-PE') },
    { key: 'user', label: 'Usuario', value: (row) => `${row.actorName ?? '—'} (${row.actorRole ?? '—'})` },
    ...(this.isSuperadmin
      ? [{ key: 'company', label: 'Empresa', value: (row: AuditEvent) => row.companyName ?? '—' }]
      : []),
    { key: 'action', label: 'Acción realizada', value: (row) => row.action },
    { key: 'entity', label: 'Entidad', value: (row) => row.entityName },
    { key: 'ip', label: 'Dirección IP', value: (row) => row.ipAddress ?? '—' },
    { key: 'detail', label: 'Detalles del evento', value: (row) => row.detail ?? '—' },
    { key: 'level', label: 'Nivel', value: (row) => row.level, type: 'status' },
  ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    if (this.isSuperadmin) {
      this.companyApi
        .list({ pageSize: 100 })
        .subscribe((page) => this.companies.set(page.items.map((c) => ({ id: c.id, name: c.tradeName }))));
    }
    this.load();
  }

  private params(pageNumber: number, pageSize: number) {
    return {
      pageNumber,
      pageSize,
      search: this.query().trim() || undefined,
      level: this.level() || undefined,
      companyId: this.companyId() || undefined,
      from: this.from() || undefined,
      to: this.to() ? `${this.to()}T23:59:59` : undefined,
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.params(this.pageNumber(), this.pageSize)).subscribe({
      next: (page) => {
        this.rows.set(page.items);
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

  onLevelChange(value: string): void {
    this.level.set(value);
    this.onFilterChange();
  }

  onCompanyChange(value: string): void {
    this.companyId.set(value);
    this.onFilterChange();
  }

  onFromChange(value: string): void {
    this.from.set(value);
    this.onFilterChange();
  }

  onToChange(value: string): void {
    this.to.set(value);
    this.onFilterChange();
  }

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  view(event: AuditEvent): void {
    this.dialog.open(AuditDetailDialog, { data: event });
  }

  async exportHistory(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const pageSize = 200;
      const collected: AuditEvent[] = [];
      let page = 1;
      for (;;) {
        const result = await new Promise<{ items: readonly AuditEvent[]; totalCount: number }>((resolve, reject) =>
          this.api.list(this.params(page, pageSize)).subscribe({ next: resolve, error: reject }),
        );
        collected.push(...result.items);
        if (collected.length >= result.totalCount || result.items.length === 0) break;
        page += 1;
      }

      if (!collected.length) {
        this.notifications.show('No hay registros que coincidan con los filtros.', 'info');
        return;
      }

      const lines = [
        'Fecha,Usuario,Empresa,Accion,Entidad,IP,Nivel,Detalle',
        ...collected.map(
          (row) =>
            `"${row.createdAt}","${row.actorName ?? ''}","${row.companyName ?? ''}","${row.action}","${row.entityName}","${row.ipAddress ?? ''}","${row.level}","${(row.detail ?? '').replace(/"/g, '""')}"`,
        ),
      ];
      const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
      const link = this.document.createElement('a');
      link.href = url;
      link.download = 'auditoria.csv';
      link.click();
      URL.revokeObjectURL(url);
      this.notifications.show(`Historial exportado (${collected.length} registros).`, 'success');
    } catch {
      this.notifications.show('No se pudo exportar el historial.', 'error');
    } finally {
      this.exporting.set(false);
    }
  }
}

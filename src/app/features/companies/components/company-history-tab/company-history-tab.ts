import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime } from 'rxjs';
import { AuditDetailDialog } from '../../../audit/components/audit-detail-dialog/audit-detail-dialog';
import { AuditApiService } from '../../../audit/data-access/audit-api.service';
import { AuditEvent } from '../../../audit/models/audit-event.model';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../../shared/ui/data-table/data-table.model';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { friendlyAction, friendlyEntity } from '../../../../shared/utils/audit-labels';
import { formatDateTime } from '../../../../shared/utils/date-format';

@Component({
  selector: 'app-company-history-tab',
  imports: [DataTable, Paginator],
  templateUrl: './company-history-tab.html',
  styleUrl: '../../../../shared/ui/list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyHistoryTab implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = input.required<string>();

  readonly loading = signal(false);
  readonly query = signal('');
  readonly level = signal('');
  readonly from = signal('');
  readonly to = signal('');
  readonly pageNumber = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly rows = signal<readonly AuditEvent[]>([]);

  private readonly search$ = new Subject<void>();

  readonly columns: readonly DataTableColumn<AuditEvent>[] = [
    { key: 'date', label: 'Fecha / hora', value: (row) => formatDateTime(row.createdAt) },
    { key: 'user', label: 'Usuario', value: (row) => `${row.actorName ?? '—'} (${row.actorRole ?? '—'})` },
    { key: 'action', label: 'Acción', value: (row) => friendlyAction(row.action) },
    { key: 'entity', label: 'Entidad', value: (row) => friendlyEntity(row.entityName) },
    { key: 'detail', label: 'Detalle', value: (row) => row.detail ?? '—' },
    { key: 'level', label: 'Nivel', value: (row) => row.level, type: 'status' },
  ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.load();
  }

  private params(pageNumber: number) {
    return {
      pageNumber,
      pageSize: this.pageSize,
      search: this.query().trim() || undefined,
      level: this.level() || undefined,
      companyId: this.companyId(),
      from: this.from() || undefined,
      to: this.to() ? `${this.to()}T23:59:59` : undefined,
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.params(this.pageNumber())).subscribe({
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

  goToPage(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  view(event: AuditEvent): void {
    this.dialog.open(AuditDetailDialog, { data: event });
  }
}

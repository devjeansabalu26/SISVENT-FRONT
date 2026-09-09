import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/notifications/notification.service';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { DataTableColumn } from '../../../shared/ui/data-table/data-table.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AuditDetailDialog } from '../components/audit-detail-dialog/audit-detail-dialog';
import { AUDIT_MOCK } from '../data-access/audit.mock';
import { AuditEvent } from '../models/audit-event.model';

@Component({
  selector: 'app-audit-page',
  imports: [DataTable, PageHeader],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPage {
  private readonly dialog = inject(MatDialog);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  readonly query = signal('');
  readonly result = signal('');

  readonly rows = computed(() => {
    const query = this.query().toLowerCase();
    return AUDIT_MOCK.filter(
      (event) =>
        `${event.user} ${event.action} ${event.module} ${event.company}`.toLowerCase().includes(query) &&
        (!this.result() || event.result === this.result()),
    );
  });

  readonly columns: readonly DataTableColumn<AuditEvent>[] = [
    { key: 'date', label: 'Fecha / hora', value: (row) => row.date },
    { key: 'user', label: 'Usuario', value: (row) => row.user },
    { key: 'action', label: 'Acción realizada', value: (row) => row.action },
    { key: 'module', label: 'Módulo', value: (row) => row.module },
    { key: 'company', label: 'Empresa / sucursal', value: (row) => row.company },
    { key: 'ip', label: 'Dirección IP', value: (row) => row.ip },
    { key: 'detail', label: 'Detalles del evento', value: (row) => row.detail },
    { key: 'result', label: 'Nivel', value: (row) => row.result, type: 'status' },
  ];

  view(event: AuditEvent): void {
    this.dialog.open(AuditDetailDialog, { data: event });
  }

  exportHistory(): void {
    const lines = [
      'Fecha,Usuario,Accion,Modulo,Empresa,IP,Nivel,Detalle',
      ...this.rows().map(
        (row) =>
          `"${row.date}","${row.user}","${row.action}","${row.module}","${row.company}","${row.ip}","${row.result}","${row.detail}"`,
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'auditoria.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.notifications.show('Historial de auditoría exportado.', 'success');
  }
}

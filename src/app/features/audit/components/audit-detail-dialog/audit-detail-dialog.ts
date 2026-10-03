import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { friendlyAction, friendlyEntity } from '../../../../shared/utils/audit-labels';
import { AuditEvent } from '../../models/audit-event.model';
import { auditFieldLabel } from '../../utils/audit-field-label';

const ROLE_LABEL: Readonly<Record<string, string>> = {
  SUPERADMIN: 'Superadministrador',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
};

/**
 * Figma `mod-detalle-auditoria` (MOD-AD-20) y `mod-detalle-auditoria-plataforma` (MOD-SA-17).
 * El backend expone un único texto `detail` (no valores antes/después separados), que se muestra
 * como "Detalle del cambio".
 */
@Component({
  selector: 'app-audit-detail-dialog',
  imports: [MatDialogModule, DateTimePipe],
  templateUrl: './audit-detail-dialog.html',
  styleUrls: ['../../../../shared/forms/dialog-form.scss', '../../../../shared/ui/review-dialog/review-dialog.scss'],
  styles: '.detail { margin: 0; padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-surface-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDetailDialog {
  readonly event = inject<AuditEvent>(MAT_DIALOG_DATA);
  /** Antes → después con el nombre del campo en español. */
  readonly changes = (this.event.changes ?? []).map((change) => ({ ...change, label: auditFieldLabel(change.field) }));
  private readonly ref = inject(MatDialogRef<AuditDetailDialog>);

  readonly code = this.event.companyName !== undefined ? 'MOD-SA-17' : 'MOD-AD-20';
  readonly role = this.event.actorRole ? (ROLE_LABEL[this.event.actorRole] ?? this.event.actorRole) : '—';
  readonly module = friendlyEntity(this.event.entityName);
  readonly action = friendlyAction(this.event.action);

  close(): void {
    this.ref.close();
  }
}

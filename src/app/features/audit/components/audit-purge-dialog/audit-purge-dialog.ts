import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { AuditApiService, AuditPurgeCode, AuditPurgeResult } from '../../data-access/audit-api.service';

export const AUDIT_CONFIRM_TEXT = 'ELIMINAR AUDITORIA';

@Component({
  selector: 'app-audit-purge-dialog',
  imports: [MatDialogModule, ReactiveFormsModule, DateTimePipe, DecimalPipe],
  templateUrl: './audit-purge-dialog.html',
  styleUrls: [
    '../../../../shared/forms/dialog-form.scss',
    '../../../../shared/ui/review-dialog/review-dialog.scss',
    './audit-purge-dialog.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPurgeDialog {
  private readonly api = inject(AuditApiService);
  private readonly dialogRef = inject(MatDialogRef<AuditPurgeDialog, AuditPurgeResult | null>);

  readonly confirmWord = AUDIT_CONFIRM_TEXT;

  readonly code = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  readonly confirmText = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  private readonly codeValue = toSignal(this.code.valueChanges, { initialValue: '' });
  private readonly textValue = toSignal(this.confirmText.valueChanges, { initialValue: '' });

  readonly sending = signal(false);
  readonly purging = signal(false);
  readonly sent = signal<AuditPurgeCode | null>(null);
  readonly error = signal<string | null>(null);

  readonly textMatches = computed(() => this.textValue().trim().replace(/\s+/g, ' ').toUpperCase() === AUDIT_CONFIRM_TEXT);
  readonly canPurge = computed(() => !!this.sent() && /^\d{6}$/.test(this.codeValue().trim()) && this.textMatches() && !this.purging());

  sendCode(): void {
    this.sending.set(true);
    this.error.set(null);
    this.api.requestPurgeCode().subscribe({
      next: (sent) => {
        this.sent.set(sent);
        this.sending.set(false);
        this.code.reset('');
        this.code.enable();
        this.confirmText.enable();
      },
      error: (cause: unknown) => {
        this.sending.set(false);
        this.error.set(this.message(cause, 'No se pudo enviar el código.'));
      },
    });
  }

  purge(): void {
    if (!this.canPurge()) return;
    this.purging.set(true);
    this.error.set(null);
    this.api.purge(this.code.value.trim(), this.confirmText.value).subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (cause: unknown) => {
        this.purging.set(false);
        this.error.set(this.message(cause, 'No se pudo eliminar la auditoría.'));
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  private message(cause: unknown, fallback: string): string {
    return cause instanceof AppHttpError && cause.message ? cause.message : fallback;
  }
}

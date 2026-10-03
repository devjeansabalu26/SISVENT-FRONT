import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { StoreApiService } from '../../../locales/data-access/store-api.service';
import { CashClosure, CashClosureApiService, CashClosurePreview } from '../../data-access/cash-closure-api.service';

/** `YYYY-MM-DD` de hoy en la zona del navegador (el backend valida el día con la zona de la empresa). */
function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * Figma `mod-cierre-caja`: resumen del día calculado por el backend (por método de pago) y registro del
 * cierre con el efectivo contado. Un local/día solo se cierra una vez; si ya existe se muestra el cierre.
 * Se cierra con el cierre registrado (o `undefined` si se cancela).
 */
@Component({
  selector: 'app-cash-close-dialog',
  imports: [MatDialogModule],
  templateUrl: './cash-close-dialog.html',
  styleUrls: ['../../../../shared/forms/dialog-form.scss', './cash-close-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashCloseDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CashCloseDialog, CashClosure>);
  private readonly api = inject(CashClosureApiService);
  private readonly storeApi = inject(StoreApiService);

  readonly today = today();
  readonly stores = signal<readonly { id: string; name: string }[]>([]);
  readonly storeId = signal<string | null>(null);
  readonly date = signal(this.today);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly preview = signal<CashClosurePreview | null>(null);

  readonly countedCash = signal<number>(0);
  readonly notes = signal('');
  readonly difference = computed(() => Math.round((this.countedCash() - (this.preview()?.expectedCash ?? 0)) * 100) / 100);

  ngOnInit(): void {
    this.storeApi.list().subscribe({
      next: (response) => this.stores.set(response.items.filter((store) => store.isActive)),
      error: () => undefined,
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.preview(this.storeId(), this.date()).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.storeId.set(preview.storeId);
        this.countedCash.set(preview.existing?.countedCash ?? preview.expectedCash);
        this.notes.set(preview.existing?.notes ?? '');
        this.loading.set(false);
      },
      error: (cause: unknown) => {
        this.loading.set(false);
        this.error.set(this.message(cause, 'No se pudo calcular el resumen de caja.'));
      },
    });
  }

  changeStore(storeId: string): void {
    this.storeId.set(storeId);
    this.load();
  }

  changeDate(date: string): void {
    if (!date) return;
    this.date.set(date);
    this.load();
  }

  confirm(): void {
    const preview = this.preview();
    if (!preview || preview.existing || this.saving()) return;
    if (!(this.countedCash() >= 0)) {
      this.error.set('Ingresa el efectivo contado en caja.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .close({ storeId: preview.storeId, businessDate: preview.businessDate, countedCash: this.countedCash(), notes: this.notes().trim() || null })
      .subscribe({
        next: (closure) => this.dialogRef.close(closure),
        error: (cause: unknown) => {
          this.saving.set(false);
          this.error.set(this.message(cause, 'No se pudo registrar el cierre de caja.'));
          if (cause instanceof AppHttpError && cause.status === 409) this.load();
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private message(cause: unknown, fallback: string): string {
    const body = cause instanceof AppHttpError
      ? (cause.originalError as { error?: { title?: unknown; errors?: unknown } } | undefined)?.error
      : undefined;
    return typeof body?.title === 'string' && !body.errors ? body.title : fallback;
  }
}

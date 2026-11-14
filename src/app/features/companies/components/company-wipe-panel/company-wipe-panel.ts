import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { CompanyApiService } from '../../data-access/company-api.service';
import { CompanyDeleteResult, CompanyWipeCode, CompanyWipeResult } from '../../models/company-data.model';

export type DangerMode = 'wipe' | 'delete';

interface DangerCopy {
  readonly icon: string;
  readonly title: string;
  readonly lead: string;
  readonly startLabel: string;
  readonly confirmLabel: string;
  readonly busyLabel: string;
  readonly ack: string;
  readonly mailHint: string;
}

const COPY: Record<DangerMode, DangerCopy> = {
  wipe: {
    icon: 'cleaning_services',
    title: 'Limpiar información',
    lead: 'Borra todo lo registrado y deja la empresa como recién creada, con su administrador y su local.',
    startLabel: 'Limpiar empresa…',
    confirmLabel: 'Limpiar empresa definitivamente',
    busyLabel: 'Limpiando…',
    ack: 'Entiendo que se borra todo lo registrado y que no se puede deshacer.',
    mailHint: 'Llegará a tu correo de SUPERADMIN, con copia al correo de Nubio Tech. Sirve una sola vez y vence en 10 minutos.',
  },
  delete: {
    icon: 'delete_forever',
    title: 'Eliminar empresa',
    lead: 'Elimina la empresa y todo lo relacionado. Desaparece del sistema y nadie de ella podrá entrar.',
    startLabel: 'Eliminar empresa…',
    confirmLabel: 'Eliminar empresa definitivamente',
    busyLabel: 'Eliminando…',
    ack: 'Entiendo que la empresa, sus usuarios y todos sus datos se eliminan y que no se puede deshacer.',
    mailHint: 'Es un código distinto al de limpiar. Llega a tu correo de SUPERADMIN, con copia al correo de Nubio Tech; sirve una sola vez y vence en 10 minutos.',
  },
};

const TABLE_LABELS: Record<string, string> = {
  products: 'Productos',
  categories: 'Categorías',
  brands: 'Marcas',
  units: 'Unidades',
  stock_by_store: 'Stock por local',
  inventory_movements: 'Movimientos de inventario',
  product_price_history: 'Historial de precios',
  sales: 'Ventas',
  sale_items: 'Detalle de ventas',
  sale_payments: 'Pagos de ventas',
  sale_annulments: 'Anulaciones',
  sale_annulment_items: 'Detalle de anulaciones',
  credit_notes: 'Notas de crédito',
  credit_note_items: 'Detalle de notas de crédito',
  einvoice_documents: 'Comprobantes electrónicos',
  clients: 'Clientes',
  suppliers: 'Proveedores',
  goods_receipts: 'Ingresos de mercadería',
  goods_receipt_items: 'Detalle de ingresos',
  cash_sessions: 'Cajas',
  cash_closures: 'Cierres de caja',
  attendance_records: 'Asistencia',
  notifications: 'Notificaciones',
  audit_logs: 'Auditoría',
  ruc_lookup_guards: 'Bloqueos de consulta RUC',
  user_profile_modules: 'Permisos de usuarios',
  user_profiles: 'Usuarios',
  AspNetUsers: 'Cuentas de acceso',
  stores: 'Locales',
  companies: 'Empresa',
};

@Component({
  selector: 'app-company-wipe-panel',
  imports: [ReactiveFormsModule, DateTimePipe],
  templateUrl: './company-wipe-panel.html',
  styleUrl: './company-wipe-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyWipePanel {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);

  readonly companyId = input.required<string>();
  readonly companyName = input<string>('');
  readonly mode = signal<DangerMode>('wipe');
  readonly wiped = output<void>();
  readonly deleted = output<CompanyDeleteResult>();
  readonly exportRequested = output<void>();

  readonly code = new FormControl(
    { value: '', disabled: true },
    { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] },
  );
  readonly confirmName = new FormControl({ value: '', disabled: true }, { nonNullable: true, validators: [Validators.required] });
  readonly acknowledged = new FormControl({ value: false, disabled: true }, { nonNullable: true });

  private readonly codeValue = toSignal(this.code.valueChanges, { initialValue: '' });
  private readonly nameValue = toSignal(this.confirmName.valueChanges, { initialValue: '' });
  private readonly ackValue = toSignal(this.acknowledged.valueChanges, { initialValue: false });

  readonly open = signal(false);
  readonly sending = signal(false);
  readonly working = signal(false);
  readonly sent = signal<CompanyWipeCode | null>(null);
  readonly error = signal<string | null>(null);
  readonly result = signal<CompanyWipeResult | null>(null);

  readonly copy = computed(() => COPY[this.mode()]);
  readonly options: readonly { readonly mode: DangerMode; readonly copy: DangerCopy }[] = [
    { mode: 'wipe', copy: COPY.wipe },
    { mode: 'delete', copy: COPY.delete },
  ];
  readonly isDelete = computed(() => this.mode() === 'delete');
  readonly nameMatches = computed(() => this.normalize(this.nameValue()) === this.normalize(this.companyName()));
  readonly canConfirm = computed(
    () => !!this.sent() && /^\d{6}$/.test(this.codeValue().trim()) && this.nameMatches() && this.ackValue() && !this.working(),
  );

  label(table: string): string {
    return TABLE_LABELS[table] ?? table.replace(/_/g, ' ');
  }

  choose(mode: DangerMode): void {
    if (this.mode() === mode || this.working()) return;
    this.cancel();
    this.result.set(null);
    this.mode.set(mode);
  }

  start(): void {
    this.open.set(true);
    this.error.set(null);
  }

  cancel(): void {
    this.open.set(false);
    this.sent.set(null);
    this.error.set(null);
    this.code.reset('');
    this.confirmName.reset('');
    this.acknowledged.reset(false);
    this.setFieldsEnabled(false);
  }

  sendCode(): void {
    this.sending.set(true);
    this.error.set(null);
    const request = this.isDelete() ? this.api.requestDeleteCode(this.companyId()) : this.api.requestWipeCode(this.companyId());
    request.subscribe({
      next: (sent) => {
        this.sent.set(sent);
        this.sending.set(false);
        this.code.reset('');
        this.setFieldsEnabled(true);
        this.notifications.show(`Código enviado a ${sent.sentTo}.`, 'success');
      },
      error: (cause: unknown) => {
        this.sending.set(false);
        this.error.set(this.message(cause, 'No se pudo enviar el código.'));
      },
    });
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.working.set(true);
    this.error.set(null);
    const code = this.code.value.trim();
    const name = this.confirmName.value;
    if (this.isDelete()) {
      this.run(this.api.deleteCompany(this.companyId(), code, name), (result) => {
        this.notifications.show(`La empresa ${result.companyName} fue eliminada.`, 'success');
        this.deleted.emit(result);
      });
    } else {
      this.run(this.api.wipe(this.companyId(), code, name), (result) => {
        this.result.set(result);
        this.notifications.show('La empresa quedó limpia.', 'success');
        this.wiped.emit();
      });
    }
  }

  private run<T>(request: Observable<T>, done: (result: T) => void): void {
    request.subscribe({
      next: (result) => {
        this.working.set(false);
        this.cancel();
        done(result);
      },
      error: (cause: unknown) => {
        this.working.set(false);
        this.error.set(this.message(cause, this.isDelete() ? 'No se pudo eliminar la empresa.' : 'No se pudo limpiar la empresa.'));
      },
    });
  }

  private setFieldsEnabled(enabled: boolean): void {
    for (const control of [this.code, this.confirmName, this.acknowledged]) {
      if (enabled) control.enable();
      else control.disable();
    }
  }

  private normalize(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private message(cause: unknown, fallback: string): string {
    return cause instanceof AppHttpError && cause.message ? cause.message : fallback;
  }
}

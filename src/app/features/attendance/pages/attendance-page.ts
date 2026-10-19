import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, interval } from 'rxjs';
import { APP_PERMISSIONS } from '../../../core/auth/constants/app-permission.constant';
import { AccessControlService } from '../../../core/auth/services/access-control.service';
import { StoreContextService } from '../../../core/context/store-context/store-context.service';
import { UserContextService } from '../../../core/context/user-context/user-context.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog.model';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AttendanceEditDialog, AttendanceEditDialogData } from '../components/attendance-edit-dialog/attendance-edit-dialog';
import { AttendanceReportPanel } from '../components/attendance-report/attendance-report';
import { AttendanceApiService, attendanceErrorMessage } from '../data-access/attendance-api.service';
import {
  AttendanceAction,
  AttendanceMarkResult,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceStoreOption,
  AttendanceWorker,
  ROLE_LABELS,
  hourOf,
} from '../models/attendance.model';
import { DayMonthTimePipe, LocalTimePipe } from '../../../shared/pipes/date-time.pipe';
import { addDays, companyToday } from '../../../core/regional/regional-format';

@Component({
  selector: 'app-attendance-page',
  imports: [PageHeader, ReactiveFormsModule, AttendanceReportPanel, LocalTimePipe, DayMonthTimePipe],
  templateUrl: './attendance-page.html',
  styleUrls: ['./attendance-page.scss', './attendance-history.scss', './attendance-today.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendancePage implements OnInit {
  private readonly api = inject(AttendanceApiService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly storeContext = inject(StoreContextService);
  private readonly user = inject(UserContextService).user;
  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');
  private readonly destroyRef = inject(DestroyRef);

  readonly isAdmin = this.user()?.role === 'ADMIN';
  readonly canManage = inject(AccessControlService).canAccess({ permissions: [APP_PERMISSIONS.attendanceManage] });

  readonly stores = signal<readonly AttendanceStoreOption[]>([]);
  readonly storeId = signal<string | null>(null);
  readonly status = signal<AttendanceStatus | null>(null);
  readonly statusLoading = signal(true);
  readonly statusError = signal<string | null>(null);

  readonly code = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{5}$/)] });
  readonly marking = signal<AttendanceAction | null>(null);
  readonly lastResult = signal<{ action: AttendanceAction; name: string; at: string } | null>(null);

  readonly history = signal<readonly AttendanceRecord[]>([]);
  readonly historyLoading = signal(false);
  readonly workers = signal<readonly AttendanceWorker[]>([]);
  readonly storeFilter = signal('');
  readonly personFilter = signal('');
  readonly from = signal(addDays(companyToday(), -6));
  readonly to = signal(companyToday());

  readonly present = computed(() => this.status()?.present ?? []);
  readonly today = computed(() => {
    const status = this.status();
    if (!status) return [];
    const records: AttendanceRecord[] = [...(status.today ?? [])];
    for (const person of status.present) {
      if (records.some((record) => record.id === person.recordId)) continue;
      records.push({
        id: person.recordId, storeId: status.storeId ?? '', storeName: status.storeName ?? '', profileId: person.profileId,
        fullName: person.fullName, role: person.role, userCode: person.userCode, workDate: status.workDate,
        checkInAt: person.checkInAt, checkOutAt: null, autoClosed: false, source: 'SELF', notes: null, version: 0,
      });
    }
    return records.sort((a, b) =>
      Number(!!a.checkOutAt) - Number(!!b.checkOutAt) || b.checkInAt.localeCompare(a.checkInAt));
  });
  private readonly codeValue = toSignal(this.code.valueChanges, { initialValue: '' });
  readonly openForCode = computed(() => {
    const code = this.codeValue();
    if (!/^\d{5}$/.test(code)) return null;
    return this.today().find((record) => record.userCode === code && !record.checkOutAt) ?? null;
  });
  readonly codeComplete = computed(() => /^\d{5}$/.test(this.codeValue()));
  readonly hour = hourOf;
  readonly storeName = computed(() => this.status()?.storeName ?? this.stores().find((s) => s.id === this.storeId())?.name ?? '');

  ngOnInit(): void {
    this.api.stores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        const preferred = this.storeContext.selectedStoreId() ?? this.user()?.branchId ?? null;
        this.storeId.set(stores.find((store) => store.id === preferred)?.id ?? stores[0]?.id ?? null);
        this.loadStatus();
      },
      error: (cause: unknown) => {
        this.statusLoading.set(false);
        this.statusError.set(attendanceErrorMessage(cause, 'No se pudo cargar la asistencia.'));
      },
    });
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.storeId() && this.marking() === null) this.loadStatus(true);
      });
    if (this.canManage) {
      this.api.workers(null).subscribe({ next: (workers) => this.workers.set(workers), error: () => undefined });
      this.loadHistory();
    }
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  changeStore(storeId: string): void {
    this.storeId.set(storeId);
    this.lastResult.set(null);
    this.loadStatus();
  }

  loadStatus(silent = false): void {
    if (!silent) this.statusLoading.set(true);
    this.statusError.set(null);
    this.api.status(this.storeId()).subscribe({
      next: (status) => {
        this.status.set(status);
        this.statusLoading.set(false);
      },
      error: (cause: unknown) => {
        this.statusLoading.set(false);
        if (!silent || !this.status()) this.statusError.set(attendanceErrorMessage(cause, 'No se pudo cargar quién está en turno.'));
      },
    });
  }

  digitsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 5);
    if (clean !== input.value) this.code.setValue(clean);
  }

  mark(action: AttendanceAction): void {
    if (this.code.invalid) {
      this.code.markAsTouched();
      this.notifications.show('Ingresa el usuario de 5 dígitos.', 'warning');
      return;
    }
    const open = this.openForCode();
    if (action === 'IN' && open) {
      this.notifications.show(`${open.fullName} ya marcó su entrada a las ${hourOf(open.checkInAt)}. Solo puede marcar su salida.`, 'warning');
      return;
    }
    this.marking.set(action);
    const request = action === 'IN'
      ? this.api.checkIn(this.code.value, this.storeId())
      : this.api.checkOut(this.code.value, this.storeId());
    request.subscribe({
      next: (result) => {
        this.marking.set(null);
        this.code.setValue('');
        this.code.markAsUntouched();
        const at = result.action === 'IN' ? result.record.checkInAt : (result.record.checkOutAt ?? result.record.checkInAt);
        this.lastResult.set({ action: result.action, name: result.record.fullName, at });
        this.notifications.show(
          `${result.action === 'IN' ? 'Entrada' : 'Salida'} registrada a las ${hourOf(at)}: ${result.record.fullName}.`,
          'success',
        );
        if (result.warning) this.notifications.show(result.warning, 'warning');
        this.applyLocally(result);
        this.refresh();
        this.codeInput()?.nativeElement.focus();
      },
      error: (cause: unknown) => {
        this.marking.set(null);
        this.notifications.show(attendanceErrorMessage(cause, 'No se pudo marcar la asistencia.'), 'error');
        this.codeInput()?.nativeElement.focus();
      },
    });
  }

  loadHistory(): void {
    if (!this.canManage) return;
    if (this.from() && this.to() && this.from() > this.to()) {
      this.notifications.show('La fecha inicial no puede ser mayor que la final.', 'warning');
      return;
    }
    this.historyLoading.set(true);
    this.api.records({
      storeId: this.storeFilter() || undefined,
      profileId: this.personFilter() || undefined,
      from: this.from() || undefined,
      to: this.to() || undefined,
    }).subscribe({
      next: (records) => {
        this.history.set(records);
        this.historyLoading.set(false);
      },
      error: (cause: unknown) => {
        this.historyLoading.set(false);
        this.notifications.show(attendanceErrorMessage(cause, 'No se pudo cargar el historial de asistencia.'), 'error');
      },
    });
  }

  clearFilters(): void {
    this.storeFilter.set('');
    this.personFilter.set('');
    this.from.set(addDays(companyToday(), -6));
    this.to.set(companyToday());
    this.loadHistory();
  }

  edit(record: AttendanceRecord | null): void {
    this.dialog
      .open<AttendanceEditDialog, AttendanceEditDialogData, AttendanceRecord>(AttendanceEditDialog, {
        data: { record, stores: this.stores(), workers: this.workers(), storeId: this.storeId() },
      })
      .afterClosed()
      .pipe(filter((saved): saved is AttendanceRecord => !!saved))
      .subscribe(() => {
        this.notifications.show(record ? 'Asistencia corregida.' : 'Asistencia registrada.', 'success');
        this.refresh();
      });
  }

  closeRecord(record: AttendanceRecord): void {
    this.confirm({
      title: 'Marcar salida',
      message: `¿Marcar ahora la salida de ${record.fullName} en ${record.storeName}?`,
      confirmLabel: 'Marcar salida',
    }, () => this.api.close(record.id), `Salida registrada: ${record.fullName}.`);
  }

  remove(record: AttendanceRecord): void {
    this.confirm({
      title: 'Eliminar asistencia',
      message: `¿Eliminar la asistencia de ${record.fullName} del ${record.workDate.split('-').reverse().join('/')}? Quedará registrado en la auditoría.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    }, () => this.api.remove(record.id), 'Asistencia eliminada.');
  }

  duration(record: AttendanceRecord): string {
    const end = record.checkOutAt ? new Date(record.checkOutAt).getTime() : Date.now();
    const minutes = Math.max(0, Math.round((end - new Date(record.checkInAt).getTime()) / 60_000));
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
  }

  private applyLocally(result: AttendanceMarkResult): void {
    const status = this.status();
    if (!status) return;
    const record = result.record;
    const today = [record, ...(status.today ?? []).filter((item) => item.id !== record.id)];
    const present = result.action === 'IN'
      ? [...status.present, {
          recordId: record.id, profileId: record.profileId, fullName: record.fullName, role: record.role,
          userCode: record.userCode, email: null, checkInAt: record.checkInAt,
        }]
      : status.present.filter((person) => person.recordId !== record.id);
    this.status.set({ ...status, today, present });
  }

  private refresh(): void {
    this.loadStatus(true);
    this.loadHistory();
  }

  private confirm(data: ConfirmDialogData, action: () => Observable<unknown>, success: string): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .pipe(filter((ok): ok is true => ok === true))
      .subscribe(() =>
        action().subscribe({
          next: () => {
            this.notifications.show(success, 'success');
            this.refresh();
          },
          error: (cause: unknown) => this.notifications.show(attendanceErrorMessage(cause, 'No se pudo completar la acción.'), 'error'),
        }),
      );
  }
}

import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { AttendanceApiService, attendanceErrorMessage } from '../../data-access/attendance-api.service';
import { AttendanceReport, AttendanceStoreOption, ROLE_LABELS } from '../../models/attendance.model';
import { formatMinutes, reportCsv, reportPdf, reportTitle } from '../../utils/attendance-report-export';

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-attendance-report',
  template: `
    <section class="report">
      <header class="section-title">
        <h2>Reporte de horas</h2>
        @if (report(); as r) {
          <span class="muted">Horario {{ r.workStart }}–{{ r.workEnd }} · tolerancia {{ r.toleranceMinutes }} min</span>
        }
      </header>
      <div class="filters">
        @if (stores().length > 1) {
          <label>Local
            <select [value]="storeId()" (change)="storeId.set($any($event.target).value)">
              <option value="">Todos los locales</option>
              @for (store of stores(); track store.id) { <option [value]="store.id">{{ store.name }}</option> }
            </select>
          </label>
        }
        <label>Desde <input type="date" [value]="from()" (change)="from.set($any($event.target).value)" /></label>
        <label>Hasta <input type="date" [value]="to()" (change)="to.set($any($event.target).value)" /></label>
        <button type="button" class="primary" [disabled]="loading()" (click)="load()">Generar</button>
        <button type="button" class="ghost" [disabled]="!report()?.rows?.length" (click)="exportExcel()">
          <span class="material-icons">table_view</span>Excel
        </button>
        <button type="button" class="ghost" [disabled]="!report()?.rows?.length || exporting()" (click)="exportPdf()">
          <span class="material-icons">picture_as_pdf</span>PDF
        </button>
      </div>

      <div class="table-scroll surface-card">
        @if (loading()) {
          <p class="state">Calculando…</p>
        } @else if (!report()?.rows?.length) {
          <p class="state">Sin registros en el período.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Persona</th><th>Rol</th><th>Días</th><th>Horas trabajadas</th><th>Tardanzas</th><th>Min. tarde</th>
                <th>Faltas</th><th>Sin salida</th>
              </tr>
            </thead>
            <tbody>
              @for (row of report()!.rows; track row.profileId) {
                <tr>
                  <td><strong>{{ row.fullName }}</strong> <small class="muted">{{ row.userCode }}</small></td>
                  <td>{{ roleLabel(row.role) }}</td>
                  <td>{{ row.daysWorked }}</td>
                  <td>{{ minutes(row.workedMinutes) }}</td>
                  <td [class.bad]="row.lateDays > 0">{{ row.lateDays }}</td>
                  <td>{{ row.lateMinutes }}</td>
                  <td [class.bad]="row.absences > 0">{{ row.absences }}</td>
                  <td [class.warn]="row.missingCheckOuts > 0">{{ row.missingCheckOuts }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total</td>
                <td>{{ totals().days }}</td>
                <td>{{ minutes(totals().minutes) }}</td>
                <td>{{ totals().late }}</td>
                <td>{{ totals().lateMinutes }}</td>
                <td>{{ totals().absences }}</td>
                <td>{{ totals().missing }}</td>
              </tr>
            </tfoot>
          </table>
        }
      </div>
      <p class="muted small">Faltas: días laborables sin asistencia (solo vendedores, sin contar hoy). Las salidas sin marcar se cuentan hasta la hora de salida del horario.</p>
    </section>
  `,
  styleUrls: ['../../pages/attendance-page.scss', '../../pages/attendance-history.scss'],
  styles: `
    .report { margin-top: var(--space-lg, 28px); }
    tfoot td { font-weight: 700; border-top: 2px solid var(--color-border); }
    .bad { color: var(--color-danger); font-weight: 700; }
    .warn { color: var(--color-warning); font-weight: 700; }
    .small { font-size: 12px; margin-top: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceReportPanel implements OnInit {
  readonly stores = input<readonly AttendanceStoreOption[]>([]);
  private readonly api = inject(AttendanceApiService);
  private readonly notifications = inject(NotificationService);
  private readonly document = inject(DOCUMENT);

  readonly storeId = signal('');
  readonly from = signal(isoDate(new Date(Date.now() - 6 * 86_400_000)));
  readonly to = signal(isoDate(new Date()));
  readonly report = signal<AttendanceReport | null>(null);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly minutes = formatMinutes;
  readonly totals = computed(() => (this.report()?.rows ?? []).reduce(
    (acc, row) => ({
      days: acc.days + row.daysWorked, minutes: acc.minutes + row.workedMinutes, late: acc.late + row.lateDays,
      lateMinutes: acc.lateMinutes + row.lateMinutes, absences: acc.absences + row.absences, missing: acc.missing + row.missingCheckOuts,
    }),
    { days: 0, minutes: 0, late: 0, lateMinutes: 0, absences: 0, missing: 0 },
  ));

  ngOnInit(): void {
    this.load();
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  load(): void {
    if (this.from() > this.to()) {
      this.notifications.show('La fecha inicial no puede ser mayor que la final.', 'warning');
      return;
    }
    this.loading.set(true);
    this.api.report({ from: this.from(), to: this.to(), storeId: this.storeId() || undefined }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (cause: unknown) => {
        this.loading.set(false);
        this.notifications.show(attendanceErrorMessage(cause, 'No se pudo generar el reporte de horas.'), 'error');
      },
    });
  }

  exportExcel(): void {
    const report = this.report();
    if (!report) return;
    this.download(new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8' }), `asistencia-${report.from}-${report.to}.csv`);
  }

  async exportPdf(): Promise<void> {
    const report = this.report();
    if (!report) return;
    this.exporting.set(true);
    try {
      const store = this.stores().find((item) => item.id === this.storeId())?.name ?? null;
      this.download(await reportPdf(report, reportTitle(report, store)), `asistencia-${report.from}-${report.to}.pdf`);
    } catch {
      this.notifications.show('No se pudo generar el PDF.', 'error');
    } finally {
      this.exporting.set(false);
    }
  }

  private download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    this.notifications.show('Reporte exportado.', 'success');
  }
}

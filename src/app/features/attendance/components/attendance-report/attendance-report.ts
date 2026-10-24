import { ExcelExportService, ExportFormat, excelTable } from '../../../../shared/export/excel-export.service';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { AttendanceApiService, attendanceErrorMessage } from '../../data-access/attendance-api.service';
import { AttendanceReport, AttendanceStoreOption, ROLE_LABELS } from '../../models/attendance.model';
import { formatMinutes, reportTitle } from '../../utils/attendance-report-export';
import { addDays, companyToday } from '../../../../core/regional/regional-format';

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
  private readonly excel = inject(ExcelExportService);

  readonly storeId = signal('');
  readonly from = signal(addDays(companyToday(), -6));
  readonly to = signal(companyToday());
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

  async exportExcel(format: ExportFormat = 'xlsx'): Promise<void> {
    const report = this.report();
    if (!report) return;
    const store = this.stores().find((item) => item.id === this.storeId())?.name ?? null;
    const names = new Map(report.rows.map((row) => [row.profileId, row.fullName]));
    const totalMinutes = report.rows.reduce((sum, row) => sum + row.workedMinutes, 0);
    try {
      await this.excel.export({
        fileName: `asistencia-${report.from}-${report.to}`,
        title: 'Reporte de asistencia',
        subtitle: reportTitle(report, store),
        sheets: [
          { name: 'Resumen', items: [
            { label: 'Horario', value: `${report.workStart} a ${report.workEnd}`, detail: `Tolerancia de ${report.toleranceMinutes} min` },
            { label: 'Personas', value: report.rows.length, type: 'integer' },
            { label: 'Horas trabajadas', value: Math.round((totalMinutes / 60) * 10) / 10, type: 'number', detail: formatMinutes(totalMinutes) },
            { label: 'Tardanzas', value: report.rows.reduce((sum, row) => sum + row.lateDays, 0), type: 'integer' },
            { label: 'Faltas', value: report.rows.reduce((sum, row) => sum + row.absences, 0), type: 'integer' },
            { label: 'Salidas sin marcar', value: report.rows.reduce((sum, row) => sum + row.missingCheckOuts, 0), type: 'integer' },
          ] },
          excelTable({ name: 'Por persona', rows: report.rows, totals: true, columns: [
            { header: 'Persona', value: (row) => row.fullName },
            { header: 'Rol', value: (row) => (row.role === 'ADMIN' ? 'Administrador' : row.role === 'VENDEDOR' ? 'Vendedor' : row.role) },
            { header: 'Usuario', value: (row) => row.userCode ?? '' },
            { header: 'Local', value: (row) => row.storeName ?? '' },
            { header: 'Días trabajados', value: (row) => row.daysWorked, type: 'integer' },
            { header: 'Horas trabajadas', value: (row) => Math.round((row.workedMinutes / 60) * 10) / 10, type: 'number' },
            { header: 'Tardanzas', value: (row) => row.lateDays, type: 'integer' },
            { header: 'Minutos de tardanza', value: (row) => row.lateMinutes, type: 'integer' },
            { header: 'Faltas', value: (row) => row.absences, type: 'integer' },
            { header: 'Salidas sin marcar', value: (row) => row.missingCheckOuts, type: 'integer' },
          ] }),
          excelTable({ name: 'Detalle por día', rows: report.days, columns: [
            { header: 'Persona', value: (day) => names.get(day.profileId) ?? '' },
            { header: 'Fecha', value: (day) => day.date, type: 'date' },
            { header: 'Entrada', value: (day) => day.firstCheckIn, type: 'datetime' },
            { header: 'Salida', value: (day) => day.lastCheckOut, type: 'datetime' },
            { header: 'Horas', value: (day) => Math.round((day.workedMinutes / 60) * 10) / 10, type: 'number' },
            { header: 'Minutos de tardanza', value: (day) => day.lateMinutes, type: 'integer' },
            { header: 'Estado', value: (day) => (day.absent ? 'Falta' : day.missingCheckOut ? 'Sin salida' : day.lateMinutes > 0 ? 'Tardanza' : 'Asistió') },
          ] }),
        ],
      }, format);
      this.notifications.show(format === 'pdf' ? 'Reporte exportado a PDF.' : 'Reporte exportado a Excel.', 'success');
    } catch {
      this.notifications.show(format === 'pdf' ? 'No se pudo generar el PDF.' : 'No se pudo generar el Excel.', 'error');
    }
  }

  async exportPdf(): Promise<void> {
    this.exporting.set(true);
    try {
      await this.exportExcel('pdf');
    } finally {
      this.exporting.set(false);
    }
  }

}

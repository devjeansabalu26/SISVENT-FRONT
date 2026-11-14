import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { AppHttpError } from '../../../../core/http/models/app-http-error.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ExcelExportService } from '../../../../shared/export/excel-export.service';
import { CompanyApiService } from '../../data-access/company-api.service';
import { ProductImportResult, ProductImportRow, ProductImportStatus } from '../../models/company-data.model';
import { CompanyStoreItem } from '../../models/company.model';
import { MAX_IMPORT_ROWS, buildExportSheets, buildProductTemplate, readProductFile } from './company-data-excel';
import { CompanyWipePanel } from '../company-wipe-panel/company-wipe-panel';

type RowFilter = 'all' | 'problems';

const STATUS_LABEL: Record<ProductImportStatus, string> = {
  NEW: 'Nuevo',
  SKIPPED: 'Omitido',
  ERROR: 'Error',
};

const STATUS_ICON: Record<ProductImportStatus, string> = {
  NEW: 'add_circle',
  SKIPPED: 'skip_next',
  ERROR: 'error',
};

const EXPORT_SHEETS: readonly { readonly label: string; readonly icon: string }[] = [
  { label: 'Productos', icon: 'inventory_2' },
  { label: 'Stock por local', icon: 'warehouse' },
  { label: 'Movimientos (kardex)', icon: 'swap_vert' },
  { label: 'Ventas y detalle', icon: 'point_of_sale' },
  { label: 'Pagos y anulaciones', icon: 'payments' },
  { label: 'Clientes', icon: 'groups' },
  { label: 'Proveedores', icon: 'local_shipping' },
  { label: 'Ingresos de mercadería', icon: 'move_to_inbox' },
  { label: 'Cajas y cierres', icon: 'account_balance_wallet' },
  { label: 'Usuarios y asistencia', icon: 'badge' },
  { label: 'Locales y configuración', icon: 'store' },
  { label: 'Auditoría', icon: 'history' },
];

@Component({
  selector: 'app-company-data-tab',
  imports: [CompanyWipePanel],
  templateUrl: './company-data-tab.html',
  styleUrls: ['../../../../shared/ui/detail-page.scss', './company-data-tab.scss', './company-data-results.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDataTab implements OnInit {
  private readonly api = inject(CompanyApiService);
  private readonly notifications = inject(NotificationService);
  private readonly excel = inject(ExcelExportService);
  private readonly document = inject(DOCUMENT);

  readonly companyId = input.required<string>();
  readonly companyName = input<string>('');
  readonly changed = output<void>();
  readonly deleted = output<void>();

  readonly statusLabel = STATUS_LABEL;
  readonly statusIcon = STATUS_ICON;
  readonly exportSheets = EXPORT_SHEETS;
  readonly maxRows = MAX_IMPORT_ROWS;
  readonly templateDownloaded = signal(false);
  readonly dragging = signal(false);

  readonly stores = signal<readonly CompanyStoreItem[]>([]);
  readonly storeId = signal<string>('');
  readonly fileName = signal<string | null>(null);
  readonly rows = signal<readonly ProductImportRow[]>([]);
  readonly fileError = signal<string | null>(null);
  readonly preview = signal<ProductImportResult | null>(null);
  readonly result = signal<ProductImportResult | null>(null);
  readonly busy = signal<'reading' | 'reviewing' | 'importing' | 'template' | null>(null);
  readonly exporting = signal(false);
  readonly rowFilter = signal<RowFilter>('all');

  readonly shown = computed(() => this.result() ?? this.preview());
  readonly visibleRows = computed(() => {
    const data = this.shown();
    if (!data) return [];
    return this.rowFilter() === 'problems' ? data.rows.filter((row) => row.status !== 'NEW') : data.rows;
  });
  readonly canConfirm = computed(() => {
    const preview = this.preview();
    return !!preview && !this.result() && preview.newCount > 0 && !preview.exceedsPlanLimit && !this.busy();
  });

  ngOnInit(): void {
    this.loadStores();
  }

  onWiped(): void {
    this.clearFile();
    this.loadStores();
    this.changed.emit();
  }

  private loadStores(): void {
    this.api.getStores(this.companyId()).subscribe({
      next: (data) => {
        const active = data.items.filter((store) => store.isActive);
        this.stores.set(active);
        if (active.length) this.storeId.set(active[0].id);
      },
      error: () => this.notifications.show('No se pudieron cargar los locales de la empresa.', 'error'),
    });
  }

  async downloadTemplate(): Promise<void> {
    this.busy.set('template');
    try {
      const blob = await buildProductTemplate(this.companyName());
      this.download(blob, `plantilla-productos-${this.slug(this.companyName()) || 'savix'}.xlsx`);
      this.templateDownloaded.set(true);
    } catch {
      this.notifications.show('No se pudo generar la plantilla.', 'error');
    } finally {
      this.busy.set(null);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.busy() && this.stores().length) this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.busy() && this.stores().length) void this.loadFile(file);
  }

  onFile(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (file) void this.loadFile(file);
  }

  private async loadFile(file: File): Promise<void> {
    this.clearFile();
    this.fileName.set(file.name);
    if (!/\.xlsx$/i.test(file.name)) {
      this.fileError.set('El archivo debe ser Excel (.xlsx). Si está en .xls o .csv, ábrelo en Excel y guárdalo como .xlsx.');
      return;
    }
    this.busy.set('reading');
    try {
      const parsed = await readProductFile(file);
      if (parsed.missingColumns.length) {
        this.fileError.set(`No encontré estas columnas en la hoja "${parsed.sheetName}": ${parsed.missingColumns.join(', ')}. Usa la plantilla o revisa los títulos.`);
      } else if (!parsed.rows.length) {
        this.fileError.set('El archivo no tiene productos debajo de los títulos.');
      } else if (parsed.rows.length > MAX_IMPORT_ROWS) {
        this.fileError.set(`El archivo tiene ${parsed.rows.length} productos. El máximo por carga es ${MAX_IMPORT_ROWS}; divídelo en varios archivos.`);
      } else {
        this.rows.set(parsed.rows);
        this.busy.set(null);
        this.review();
        return;
      }
    } catch {
      this.fileError.set('No se pudo leer el archivo. Verifica que sea un Excel válido y que no esté protegido con clave.');
    }
    this.busy.set(null);
  }

  onStoreChange(value: string): void {
    this.storeId.set(value);
    if (this.rows().length && !this.result()) this.review();
  }

  review(): void {
    if (!this.rows().length || !this.storeId()) return;
    this.busy.set('reviewing');
    this.preview.set(null);
    this.api.importProducts(this.companyId(), { storeId: this.storeId(), dryRun: true, rows: this.rows() }).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.rowFilter.set(preview.skippedCount + preview.errorCount > 0 ? 'problems' : 'all');
        this.busy.set(null);
      },
      error: (cause: unknown) => {
        this.busy.set(null);
        this.fileError.set(this.message(cause, 'No se pudo revisar el archivo.'));
      },
    });
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.busy.set('importing');
    this.api.importProducts(this.companyId(), { storeId: this.storeId(), dryRun: false, rows: this.rows() }).subscribe({
      next: (result) => {
        this.result.set(result);
        this.rowFilter.set(result.skippedCount + result.errorCount > 0 ? 'problems' : 'all');
        this.busy.set(null);
        this.notifications.show(`Se cargaron ${result.newCount} productos.`, 'success');
        this.changed.emit();
      },
      error: (cause: unknown) => {
        this.busy.set(null);
        this.notifications.show(this.message(cause, 'No se pudieron cargar los productos.'), 'error');
      },
    });
  }

  clearFile(): void {
    this.fileName.set(null);
    this.rows.set([]);
    this.fileError.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.rowFilter.set('all');
  }

  exportAll(): void {
    this.exporting.set(true);
    this.api.exportData(this.companyId()).subscribe({
      next: async (data) => {
        try {
          await this.excel.export({
            fileName: `datos-${this.slug(data.companyName) || 'empresa'}`,
            title: 'Exportación de datos',
            subtitle: data.companyName,
            sheets: buildExportSheets(data),
          });
          this.notifications.show('Exportación lista. Revisa tus descargas.', 'success');
        } catch {
          this.notifications.show('No se pudo armar el Excel de exportación.', 'error');
        } finally {
          this.exporting.set(false);
        }
      },
      error: (cause: unknown) => {
        this.exporting.set(false);
        this.notifications.show(this.message(cause, 'No se pudo exportar la información.'), 'error');
      },
    });
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private message(cause: unknown, fallback: string): string {
    return cause instanceof AppHttpError && cause.message ? cause.message : fallback;
  }

  private slug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

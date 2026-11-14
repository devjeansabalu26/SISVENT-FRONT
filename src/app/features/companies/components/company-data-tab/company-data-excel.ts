import type { Cell, DataValidation, Worksheet } from 'exceljs';
import { ExcelCellType, ExcelSheet, ExcelValue } from '../../../../shared/export/excel-export.service';
import { CompanyExport, CompanyExportValue, ProductImportRow } from '../../models/company-data.model';

type ImportField = Exclude<keyof ProductImportRow, 'rowNumber'>;

interface TemplateColumn {
  readonly field: ImportField;
  readonly header: string;
  readonly width: number;
  readonly hint: string;
  readonly example: string;
  readonly numeric?: boolean;
}

interface RangeValidations {
  readonly dataValidations?: { add(range: string, validation: DataValidation): void };
}

export const MAX_IMPORT_ROWS = 3000;

const TEMPLATE_COLUMNS: readonly TemplateColumn[] = [
  { field: 'name', header: 'Nombre del producto *', width: 38, hint: 'Obligatorio. Como lo verá el vendedor al buscarlo.', example: 'Gaseosa Inca Kola 500 ml' },
  { field: 'salePrice', header: 'Precio de venta *', width: 16, hint: 'Obligatorio. Solo el número, sin S/. Ejemplo: 3.50', example: '3.50', numeric: true },
  { field: 'sku', header: 'Código (SKU)', width: 16, hint: 'Opcional. Si lo dejas vacío, el sistema crea uno (PROD-00001).', example: 'GAS-IK-500' },
  { field: 'barcode', header: 'Código de barras', width: 18, hint: 'Opcional. El número que lee la pistola.', example: '7751271011103' },
  { field: 'category', header: 'Categoría', width: 20, hint: 'Opcional. Si no existe, se crea.', example: 'Bebidas' },
  { field: 'brand', header: 'Marca', width: 18, hint: 'Opcional. Si no existe, se crea.', example: 'Inca Kola' },
  { field: 'unit', header: 'Unidad de medida', width: 18, hint: 'Opcional. Unidad, kg, litro, caja, paquete…', example: 'Unidad' },
  { field: 'cost', header: 'Costo', width: 12, hint: 'Opcional. Lo que te cuesta a ti. Sirve para ver la ganancia.', example: '2.40', numeric: true },
  { field: 'initialStock', header: 'Stock inicial', width: 14, hint: 'Opcional. Cuántas unidades tienes hoy en el local.', example: '48', numeric: true },
  { field: 'minStock', header: 'Stock mínimo', width: 14, hint: 'Opcional. Con esta cantidad o menos, Savix te avisa.', example: '12', numeric: true },
];

const HEADER_ALIASES: Record<ImportField, readonly string[]> = {
  name: ['nombre del producto', 'nombre', 'producto', 'descripcion', 'articulo'],
  salePrice: ['precio de venta', 'precio venta', 'precio', 'pvp', 'precio unitario'],
  sku: ['codigo (sku)', 'codigo sku', 'sku', 'codigo', 'codigo interno'],
  barcode: ['codigo de barras', 'cod barras', 'codigo barras', 'barcode', 'ean'],
  category: ['categoria', 'rubro', 'familia', 'linea'],
  brand: ['marca'],
  unit: ['unidad de medida', 'unidad', 'um', 'medida'],
  cost: ['costo', 'precio de compra', 'precio compra', 'costo unitario'],
  initialStock: ['stock inicial', 'stock', 'cantidad', 'existencias'],
  minStock: ['stock minimo', 'minimo', 'stock min'],
};

export interface ParsedProductFile {
  readonly rows: readonly ProductImportRow[];
  readonly sheetName: string;
  readonly missingColumns: readonly string[];
}

export async function buildProductTemplate(companyName: string): Promise<Blob> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'Nubio Tech';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Productos', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = TEMPLATE_COLUMNS.map((column) => ({ header: column.header, key: column.field, width: column.width }));
  const header = sheet.getRow(1);
  header.height = 30;
  header.eachCell((cell, index) => {
    const required = TEMPLATE_COLUMNS[index - 1].header.endsWith('*');
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: required ? 'FF1D4ED8' : 'FF0B1B44' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.note = TEMPLATE_COLUMNS[index - 1].hint;
  });
  const validations = (sheet as unknown as RangeValidations).dataValidations;
  TEMPLATE_COLUMNS.forEach((column, index) => {
    const letter = sheet.getColumn(index + 1).letter;
    if (column.numeric) {
      validations?.add(`${letter}2:${letter}${MAX_IMPORT_ROWS + 1}`, {
        type: 'decimal', operator: 'greaterThanOrEqual', formulae: [0], allowBlank: true,
        showErrorMessage: true, errorTitle: 'Número no válido', error: 'Escribe solo un número mayor o igual a 0, sin S/.',
      });
      sheet.getColumn(index + 1).numFmt = '0.00';
    } else {
      sheet.getColumn(index + 1).numFmt = '@';
    }
  });

  const guide = workbook.addWorksheet('Instrucciones', { views: [{ showGridLines: false }] });
  guide.getColumn(1).width = 26;
  guide.getColumn(2).width = 64;
  guide.getColumn(3).width = 26;
  guide.mergeCells('A1:C1');
  guide.getCell('A1').value = `Plantilla de productos para Savix${companyName ? ` · ${companyName}` : ''}`;
  guide.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1D4ED8' } };
  guide.mergeCells('A2:C2');
  guide.getCell('A2').value = 'Llena la hoja "Productos": un producto por fila, desde la fila 2. No cambies los títulos de las columnas.';
  guide.mergeCells('A3:C3');
  guide.getCell('A3').value = 'Las columnas con * son obligatorias. Cuando termines, envía este archivo a Nubio Tech y nosotros cargamos tus productos.';
  const titles = guide.getRow(5);
  ['Columna', 'Qué escribir', 'Ejemplo'].forEach((text, index) => {
    const cell = titles.getCell(index + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B44' } };
  });
  TEMPLATE_COLUMNS.forEach((column, index) => {
    const row = guide.getRow(6 + index);
    row.getCell(1).value = column.header;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = column.hint;
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(3).value = column.example;
  });
  guide.getCell(`A${7 + TEMPLATE_COLUMNS.length}`).value = `Máximo ${MAX_IMPORT_ROWS} productos por archivo. Si tienes más, usa varios archivos.`;
  guide.getCell(`A${7 + TEMPLATE_COLUMNS.length}`).font = { italic: true, color: { argb: 'FF64748B' } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function readProductFile(file: File): Promise<ParsedProductFile> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets.find((ws) => normalize(ws.name) === 'productos') ?? workbook.worksheets[0];
  if (!sheet) return { rows: [], sheetName: '', missingColumns: ['Nombre del producto', 'Precio de venta'] };

  const { headerRow, columns } = locateHeader(sheet);
  const missingColumns = [
    columns.has('name') ? null : 'Nombre del producto',
    columns.has('salePrice') ? null : 'Precio de venta',
  ].filter((value): value is string => value !== null);
  if (missingColumns.length) return { rows: [], sheetName: sheet.name, missingColumns };

  const rows: ProductImportRow[] = [];
  for (let index = headerRow + 1; index <= sheet.rowCount; index++) {
    const excelRow = sheet.getRow(index);
    const read = (field: ImportField): string | null => {
      const column = columns.get(field);
      return column ? cellText(excelRow.getCell(column)) : null;
    };
    const row: ProductImportRow = {
      rowNumber: index,
      name: read('name'), sku: read('sku'), barcode: read('barcode'), category: read('category'), brand: read('brand'),
      unit: read('unit'), salePrice: read('salePrice'), cost: read('cost'), initialStock: read('initialStock'), minStock: read('minStock'),
    };
    if (Object.entries(row).some(([key, value]) => key !== 'rowNumber' && value !== null)) rows.push(row);
  }
  return { rows, sheetName: sheet.name, missingColumns: [] };
}

function locateHeader(sheet: Worksheet): { headerRow: number; columns: Map<ImportField, number> } {
  let best = { headerRow: 1, columns: new Map<ImportField, number>() };
  for (let index = 1; index <= Math.min(10, sheet.rowCount); index++) {
    const columns = new Map<ImportField, number>();
    sheet.getRow(index).eachCell((cell, column) => {
      const text = normalize(cellText(cell) ?? '');
      if (!text) return;
      for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [ImportField, readonly string[]][]) {
        if (!columns.has(field) && aliases.includes(text)) {
          columns.set(field, column);
          break;
        }
      }
    });
    if (columns.size > best.columns.size) best = { headerRow: index, columns };
  }
  return best;
}

function cellText(cell: Cell): string | null {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'object' && 'result' in value && typeof value.result === 'number') return String(value.result);
  const text = (cell.text ?? '').trim();
  return text.length ? text : null;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CELL = 32000;

export function buildExportSheets(data: CompanyExport): ExcelSheet[] {
  const summary: ExcelSheet = {
    name: 'Resumen',
    items: [
      { label: 'Empresa', value: data.companyName },
      { label: 'Generado', value: data.generatedAt, type: 'datetime' },
      ...data.sheets.map((sheet) => ({ label: sheet.name, value: sheet.rowCount, type: 'integer' as const, detail: 'registros' })),
    ],
  };
  const tables: ExcelSheet[] = data.sheets.map((sheet) => {
    const keys: string[] = [];
    for (const row of sheet.rows) for (const key of Object.keys(row)) if (!keys.includes(key)) keys.push(key);
    const types = keys.map((key) => inferType(sheet.rows.map((row) => row[key])));
    return {
      kind: 'table' as const,
      name: sheet.name,
      title: `${sheet.name} · ${data.companyName}`,
      columns: keys.map((key, index) => ({ header: prettyHeader(key), type: types[index] })),
      rows: sheet.rows.map((row) => keys.map((key) => toCell(row[key]))),
    };
  });
  return [summary, ...tables];
}

function inferType(values: readonly CompanyExportValue[]): ExcelCellType {
  const sample = values.find((value) => value !== null && value !== undefined && value !== '');
  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'string' && ISO_DATETIME.test(sample)) return 'datetime';
  if (typeof sample === 'string' && ISO_DATE.test(sample)) return 'date';
  return 'text';
}

function toCell(value: CompanyExportValue | undefined): ExcelValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > MAX_CELL ? `${text.slice(0, MAX_CELL)}…` : text;
}

function prettyHeader(key: string): string {
  if (!key.includes('_') && key !== key.toLowerCase()) return key;
  const text = key.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

import type { jsPDF } from 'jspdf';
import { currentRegional, formatCalendarDate, formatDateTime, formatMoney, formatQuantity } from '../../core/regional/regional-format';
import type { ExcelCellType, ExcelExportOptions, ExcelSheet, ExcelValue } from './excel-export.service';

interface PdfContext {
  readonly companyName: string;
  readonly accent: readonly [number, number, number];
}

interface PdfColumn {
  readonly header: string;
  readonly type?: ExcelCellType;
  readonly width: number;
}

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP = 30;
const BOTTOM = PAGE_HEIGHT - 14;
const LINE = 3.6;
const PADDING = 1.6;

export async function renderPdf(options: ExcelExportOptions, context: PdfContext): Promise<Blob> {
  const { jsPDF: PdfClass } = await import('jspdf');
  const doc = new PdfClass({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const generated = `Generado el ${formatDateTime(new Date())}`;
  let y = TOP;

  const header = (): void => {
    doc.setFillColor(...context.accent);
    doc.rect(0, 0, PAGE_WIDTH, 3, 'F');
    doc.setTextColor(...context.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(options.title, MARGIN, 12);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const line = [context.companyName, options.subtitle].filter(Boolean).join(' · ');
    if (line) doc.text(doc.splitTextToSize(line, CONTENT_WIDTH - 60)[0], MARGIN, 18);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(generated, PAGE_WIDTH - MARGIN, 12, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 22, PAGE_WIDTH - MARGIN, 22);
    doc.setTextColor(15, 23, 42);
    y = TOP;
  };

  const newPage = (): void => {
    doc.addPage();
    header();
  };

  const ensure = (height: number): boolean => {
    if (y + height <= BOTTOM) return false;
    newPage();
    return true;
  };

  header();
  options.sheets.forEach((sheet, index) => {
    if (index > 0) ensure(30);
    if (index > 0) y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(sheet.name, MARGIN, y);
    y += 2;
    if (!('items' in sheet) && sheet.note) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const lines = doc.splitTextToSize(sheet.note, CONTENT_WIDTH);
      y += 3;
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE - 1;
    }
    y += 3;
    const { columns, rows } = toTable(sheet);
    drawTable(doc, columns, rows, 'items' in sheet ? null : totalsRow(sheet), context, () => y, (value) => (y = value), ensure);
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Savix', MARGIN, PAGE_HEIGHT - 7);
    doc.text(`Página ${page} de ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: 'right' });
  }
  return doc.output('blob');
}

function toTable(sheet: ExcelSheet): { columns: readonly PdfColumn[]; rows: readonly (readonly string[])[] } {
  if ('items' in sheet) {
    const rows = sheet.items.map((item) => [item.label, format(item.value, item.type), item.detail ?? '']);
    return { columns: widths([{ header: 'Indicador' }, { header: 'Valor', type: 'number' }, { header: 'Detalle' }], rows, [0.3, 0.2, 0.5]), rows };
  }
  const rows = sheet.rows.map((row) => sheet.columns.map((column, index) => format(row[index], column.type)));
  return { columns: widths(sheet.columns, rows), rows };
}

function totalsRow(sheet: ExcelSheet): readonly string[] | null {
  if ('items' in sheet || !sheet.totals || !sheet.rows.length) return null;
  return sheet.columns.map((column, index) => {
    if (index === 0) return 'Total';
    const summable = column.total ?? (column.type === 'money' || column.type === 'integer' || column.type === 'number');
    if (!summable) return '';
    const sum = sheet.rows.reduce((acc, row) => acc + (typeof row[index] === 'number' ? (row[index] as number) : 0), 0);
    return format(sum, column.type);
  });
}

function widths(
  columns: readonly { readonly header: string; readonly type?: ExcelCellType }[],
  rows: readonly (readonly string[])[],
  fixed?: readonly number[],
): readonly PdfColumn[] {
  const weights = fixed ?? columns.map((column, index) => {
    const longest = Math.max(column.header.length, ...rows.slice(0, 200).map((row) => (row[index] ?? '').length));
    return Math.min(Math.max(longest, 6), column.type && column.type !== 'text' ? 16 : 40);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return columns.map((column, index) => ({ header: column.header, type: column.type, width: (weights[index] / total) * CONTENT_WIDTH }));
}

function drawTable(
  doc: jsPDF, columns: readonly PdfColumn[], rows: readonly (readonly string[])[], totals: readonly string[] | null,
  context: PdfContext, getY: () => number, setY: (value: number) => void, ensure: (height: number) => boolean,
): void {
  const fontSize = columns.length > 10 ? 6.5 : columns.length > 7 ? 7.5 : 8;
  const drawHeader = (): void => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    const lines = columns.map((column) => doc.splitTextToSize(column.header, column.width - PADDING * 2) as string[]);
    const height = Math.max(...lines.map((line) => line.length)) * LINE + PADDING * 2;
    ensure(height + LINE * 2);
    let x = MARGIN;
    doc.setFillColor(...context.accent);
    doc.rect(MARGIN, getY(), CONTENT_WIDTH, height, 'F');
    doc.setTextColor(255, 255, 255);
    columns.forEach((column, index) => {
      const numeric = isNumeric(column.type);
      doc.text(lines[index], numeric ? x + column.width - PADDING : x + PADDING, getY() + PADDING + LINE - 0.8, { align: numeric ? 'right' : 'left' });
      x += column.width;
    });
    setY(getY() + height);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
  };

  drawHeader();
  if (!rows.length) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Sin datos en este período.', MARGIN + PADDING, getY() + LINE + 1);
    setY(getY() + LINE + 4);
    doc.setTextColor(15, 23, 42);
    return;
  }

  const drawRow = (cells: readonly string[], index: number, bold: boolean): void => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    const lines = cells.map((cell, column) => doc.splitTextToSize(cell, columns[column].width - PADDING * 2) as string[]);
    const height = Math.max(...lines.map((line) => line.length)) * LINE + PADDING * 2;
    if (ensure(height)) drawHeader();
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    if (bold) {
      doc.setDrawColor(...context.accent);
      doc.line(MARGIN, getY(), MARGIN + CONTENT_WIDTH, getY());
    } else if (index % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(MARGIN, getY(), CONTENT_WIDTH, height, 'F');
    }
    let x = MARGIN;
    cells.forEach((_, column) => {
      const numeric = isNumeric(columns[column].type);
      doc.text(lines[column], numeric ? x + columns[column].width - PADDING : x + PADDING, getY() + PADDING + LINE - 0.8, { align: numeric ? 'right' : 'left' });
      x += columns[column].width;
    });
    setY(getY() + height);
    if (!bold) {
      doc.setDrawColor(226, 232, 240);
      doc.line(MARGIN, getY(), MARGIN + CONTENT_WIDTH, getY());
    }
  };

  rows.forEach((row, index) => drawRow(row, index, false));
  if (totals) drawRow(totals, 0, true);
}

function format(value: ExcelValue, type: ExcelCellType = 'text'): string {
  if (value === null || value === undefined || value === '') return type === 'text' ? '' : '—';
  if (typeof value === 'string' && type !== 'date' && type !== 'datetime') return value;
  switch (type) {
    case 'money':
      return formatMoney(Number(value));
    case 'integer':
      return Math.round(Number(value)).toLocaleString(currentRegional().locale);
    case 'number':
      return formatQuantity(Number(value), 2);
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? formatCalendarDate(String(value)) : formatDateTime(String(value)).split(' ')[0];
    case 'datetime':
      return formatDateTime(String(value));
    default:
      return String(value);
  }
}

function isNumeric(type: ExcelCellType | undefined): boolean {
  return type === 'money' || type === 'number' || type === 'integer' || type === 'percent';
}

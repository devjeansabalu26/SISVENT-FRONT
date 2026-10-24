import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import type { Cell, Workbook, Worksheet } from 'exceljs';
import { CompanyContextService } from '../../core/context/company-context/company-context.service';
import { currentRegional, formatDateTime } from '../../core/regional/regional-format';
import { renderPdf } from './pdf-export';

export type ExportFormat = 'xlsx' | 'pdf';
export type ExcelCellType = 'text' | 'money' | 'number' | 'integer' | 'percent' | 'date' | 'datetime';
export type ExcelValue = string | number | null | undefined;

export interface ExcelColumn<T> {
  readonly header: string;
  readonly value: (row: T) => ExcelValue;
  readonly type?: ExcelCellType;
  readonly width?: number;
  readonly total?: boolean;
}

export interface ExcelTableSheet<T> {
  readonly name: string;
  readonly title?: string;
  readonly note?: string;
  readonly columns: readonly ExcelColumn<T>[];
  readonly rows: readonly T[];
  readonly totals?: boolean;
}

export interface ExcelSummaryItem {
  readonly label: string;
  readonly value: ExcelValue;
  readonly type?: ExcelCellType;
  readonly detail?: string;
}

export interface ExcelSummarySheet {
  readonly name: string;
  readonly items: readonly ExcelSummaryItem[];
}

export interface ExcelColumnSpec {
  readonly header: string;
  readonly type?: ExcelCellType;
  readonly width?: number;
  readonly total?: boolean;
}

export interface ExcelTableData {
  readonly kind: 'table';
  readonly name: string;
  readonly title?: string;
  readonly note?: string;
  readonly totals?: boolean;
  readonly columns: readonly ExcelColumnSpec[];
  readonly rows: readonly (readonly ExcelValue[])[];
}

export type ExcelSheet = ExcelTableData | ExcelSummarySheet;

export interface ExcelExportOptions {
  readonly fileName: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly sheets: readonly ExcelSheet[];
}

export function excelTable<T>(sheet: ExcelTableSheet<T>): ExcelTableData {
  return {
    kind: 'table',
    name: sheet.name,
    title: sheet.title,
    note: sheet.note,
    totals: sheet.totals,
    columns: sheet.columns.map(({ header, type, width, total }) => ({ header, type, width, total })),
    rows: sheet.rows.map((row) => sheet.columns.map((column) => column.value(row))),
  };
}

const HEADER_ROW = 5;
const ZEBRA = 'FFF5F7FA';
const BORDER = 'FFE2E8F0';
const MUTED = 'FF64748B';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  private readonly document = inject(DOCUMENT);
  private readonly company = inject(CompanyContextService);

  async export(options: ExcelExportOptions, format: ExportFormat = 'xlsx'): Promise<void> {
    if (format === 'pdf') {
      const accent = this.accentColor();
      const rgb = [1, 3, 5].map((start) => parseInt(accent.slice(start + 1, start + 3), 16)) as [number, number, number];
      const blob = await renderPdf(options, { companyName: this.company.company()?.commercialName ?? '', accent: rgb });
      this.download(blob, `${options.fileName}-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    }
    const { Workbook: WorkbookClass } = await import('exceljs');
    const workbook: Workbook = new WorkbookClass();
    workbook.creator = 'Savix';
    workbook.created = new Date();
    const accent = this.accentColor();
    const companyName = this.company.company()?.commercialName ?? '';
    const generated = `Generado el ${formatDateTime(new Date())}`;

    for (const sheet of options.sheets) {
      const worksheet = workbook.addWorksheet(this.sheetName(sheet.name), { views: [{ showGridLines: false }] });
      const context = [companyName, options.subtitle].filter(Boolean).join(' · ');
      if ('items' in sheet) this.writeSummary(worksheet, sheet, options.title, context, generated, accent);
      else this.writeTable(worksheet, sheet, sheet.title ?? `${options.title} · ${sheet.name}`, context, generated, accent);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.download(blob, `${options.fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private writeTable(
    worksheet: Worksheet, sheet: ExcelTableData, heading: string, context: string, generated: string, accent: string,
  ): void {
    const columns = sheet.columns;
    const span = Math.max(columns.length, 2);
    this.writeHeading(worksheet, heading, context, sheet.note ?? generated, span, accent);

    const header = worksheet.getRow(HEADER_ROW);
    columns.forEach((column, index) => {
      const cell = header.getCell(index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent } };
      cell.alignment = { vertical: 'middle', horizontal: this.isNumeric(column.type) ? 'right' : 'left', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: accent } } };
    });
    header.height = 22;

    sheet.rows.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(HEADER_ROW + 1 + rowIndex);
      columns.forEach((column, index) => {
        const cell = excelRow.getCell(index + 1);
        this.setValue(cell, row[index], column.type);
        if (rowIndex % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
        cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
      });
    });

    const lastDataRow = HEADER_ROW + sheet.rows.length;
    if (sheet.totals && sheet.rows.length) {
      const totals = worksheet.getRow(lastDataRow + 1);
      columns.forEach((column, index) => {
        const cell = totals.getCell(index + 1);
        const summable = column.total ?? (column.type === 'money' || column.type === 'integer' || column.type === 'number');
        if (index === 0) cell.value = 'Total';
        else if (summable) {
          const letter = worksheet.getColumn(index + 1).letter;
          cell.value = { formula: `SUM(${letter}${HEADER_ROW + 1}:${letter}${lastDataRow})` };
          cell.numFmt = this.numberFormat(column.type);
        }
        cell.font = { bold: true };
        cell.border = { top: { style: 'thin', color: { argb: accent } } };
      });
    }

    if (!sheet.rows.length) {
      const empty = worksheet.getCell(HEADER_ROW + 1, 1);
      empty.value = 'Sin datos en este período.';
      empty.font = { italic: true, color: { argb: MUTED } };
    }

    columns.forEach((column, index) => {
      const sample = sheet.rows.slice(0, 200).map((row) => this.displayLength(row[index], column.type));
      worksheet.getColumn(index + 1).width = column.width ?? Math.min(Math.max(column.header.length + 2, ...sample, 10), 50);
    });

    if (sheet.rows.length) {
      worksheet.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: lastDataRow, column: columns.length } };
    }
    worksheet.views = [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }];
  }

  private writeSummary(
    worksheet: Worksheet, sheet: ExcelSummarySheet, heading: string, context: string, generated: string, accent: string,
  ): void {
    this.writeHeading(worksheet, heading, context, generated, 3, accent);
    const header = worksheet.getRow(HEADER_ROW);
    ['Indicador', 'Valor', 'Detalle'].forEach((label, index) => {
      const cell = header.getCell(index + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent } };
      cell.alignment = { horizontal: index === 1 ? 'right' : 'left' };
    });
    sheet.items.forEach((item, index) => {
      const row = worksheet.getRow(HEADER_ROW + 1 + index);
      row.getCell(1).value = item.label;
      row.getCell(1).font = { bold: true };
      this.setValue(row.getCell(2), item.value, item.type);
      row.getCell(3).value = item.detail ?? '';
      row.getCell(3).font = { color: { argb: MUTED } };
      for (let column = 1; column <= 3; column++) {
        const cell = row.getCell(column);
        cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
        if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      }
    });
    worksheet.getColumn(1).width = Math.max(18, ...sheet.items.map((item) => item.label.length + 2));
    worksheet.getColumn(2).width = Math.max(16, ...sheet.items.map((item) => this.displayLength(item.value, item.type)));
    worksheet.getColumn(3).width = Math.min(Math.max(20, ...sheet.items.map((item) => (item.detail ?? '').length + 2)), 70);
  }

  private writeHeading(worksheet: Worksheet, heading: string, context: string, note: string, span: number, accent: string): void {
    worksheet.mergeCells(1, 1, 1, span);
    const title = worksheet.getCell(1, 1);
    title.value = heading;
    title.font = { bold: true, size: 16, color: { argb: accent } };
    worksheet.getRow(1).height = 24;
    if (context) {
      worksheet.mergeCells(2, 1, 2, span);
      const line = worksheet.getCell(2, 1);
      line.value = context;
      line.font = { size: 11, color: { argb: 'FF334155' } };
    }
    worksheet.mergeCells(3, 1, 3, span);
    const generatedCell = worksheet.getCell(3, 1);
    generatedCell.value = note;
    generatedCell.font = { italic: true, size: 9, color: { argb: MUTED } };
  }

  private setValue(cell: Cell, value: ExcelValue, type: ExcelCellType = 'text'): void {
    if (value === null || value === undefined || value === '') {
      cell.value = type === 'text' ? '' : '—';
      if (type !== 'text') cell.alignment = { horizontal: 'right' };
      return;
    }
    if (type === 'date' || type === 'datetime') {
      const date = this.toExcelDate(String(value), type === 'date');
      cell.value = date ?? String(value);
      if (date) cell.numFmt = type === 'date' ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm';
      return;
    }
    if (this.isNumeric(type) && typeof value === 'number' && Number.isFinite(value)) {
      cell.value = value;
      cell.numFmt = this.numberFormat(type);
      cell.alignment = { horizontal: 'right' };
      return;
    }
    cell.value = typeof value === 'number' ? value : String(value);
  }

  private numberFormat(type: ExcelCellType | undefined): string {
    const regional = currentRegional();
    const decimals = regional.currencyDecimals > 0 ? `.${'0'.repeat(regional.currencyDecimals)}` : '';
    switch (type) {
      case 'money':
        return `"${regional.currencySymbol.replace(/"/g, '')} "#,##0${decimals};-"${regional.currencySymbol.replace(/"/g, '')} "#,##0${decimals}`;
      case 'integer':
        return '#,##0';
      case 'percent':
        return '0.0"%"';
      default:
        return '#,##0.##';
    }
  }

  private toExcelDate(value: string, dateOnly: boolean): Date | null {
    if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: currentRegional().timezone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(parsed);
      const get = (part: string) => Number(parts.find((p) => p.type === part)?.value ?? 0);
      return dateOnly
        ? new Date(Date.UTC(get('year'), get('month') - 1, get('day')))
        : new Date(Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')));
    } catch {
      return parsed;
    }
  }

  private displayLength(value: ExcelValue, type: ExcelCellType | undefined): number {
    if (value === null || value === undefined) return 4;
    if (type === 'money') return String(Math.round(Number(value))).length + 8;
    if (type === 'datetime') return 18;
    if (type === 'date') return 12;
    return String(value).length + 2;
  }

  private isNumeric(type: ExcelCellType | undefined): boolean {
    return type === 'money' || type === 'number' || type === 'integer' || type === 'percent';
  }

  private sheetName(name: string): string {
    return name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Hoja';
  }

  private accentColor(): string {
    try {
      const raw = getComputedStyle(this.document.documentElement).getPropertyValue('--color-primary').trim();
      const hex = /^#([0-9a-f]{6})$/i.exec(raw)?.[1];
      if (hex) return `FF${hex.toUpperCase()}`;
      const rgb = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(raw);
      if (rgb) return `FF${[rgb[1], rgb[2], rgb[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    } catch {
      return 'FF1D4ED8';
    }
    return 'FF1D4ED8';
  }
}

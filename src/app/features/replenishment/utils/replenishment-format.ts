import { StockRiskItem } from '../models/replenishment.model';

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

export function formatSoles(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const bySupplier = (a: string | null, b: string | null): number =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b, 'es');

export function purchaseOrderCsv(items: readonly StockRiskItem[]): string {
  const rows = [...items]
    .filter((item) => item.suggestedQuantity > 0)
    .sort((a, b) => bySupplier(a.supplierName, b.supplierName) || a.name.localeCompare(b.name));
  const header = ['Proveedor', 'SKU', 'Producto', 'Cantidad sugerida', 'Stock actual', 'Stock mínimo', 'Venta diaria', 'Reposición (días)'];
  const lines = rows.map((item) => [
    item.supplierName ?? 'Sin proveedor asignado',
    item.sku,
    item.name,
    item.suggestedQuantity,
    formatQuantity(item.currentStock),
    formatQuantity(item.minStock),
    formatQuantity(item.averageDailySales),
    item.leadTimeDays,
  ]);
  return '﻿' + [header, ...lines].map((line) => line.map(csvCell).join(';')).join('\n');
}

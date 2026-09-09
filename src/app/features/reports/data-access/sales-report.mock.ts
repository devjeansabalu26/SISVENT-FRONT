import { SalesChartPoint, SalesReportRow } from '../models/sales-report.model';

export const SALES_REPORT_MOCK: readonly SalesReportRow[] = [
  { id: '2026-03', period: 'Marzo 2026', salesCount: 284, revenue: 18420, averageTicket: 64.86, topSeller: 'Carlos Méndez' },
  { id: '2026-04', period: 'Abril 2026', salesCount: 312, revenue: 21350, averageTicket: 68.43, topSeller: 'Ana Torres' },
  { id: '2026-05', period: 'Mayo 2026', salesCount: 298, revenue: 20180, averageTicket: 67.72, topSeller: 'Carlos Méndez' },
  { id: '2026-06', period: 'Junio 2026', salesCount: 341, revenue: 24690, averageTicket: 72.40, topSeller: 'Luis Vargas' },
  { id: '2026-07', period: 'Julio 2026', salesCount: 365, revenue: 27140, averageTicket: 74.36, topSeller: 'Ana Torres' },
  { id: '2026-08', period: 'Agosto 2026', salesCount: 389, revenue: 29480, averageTicket: 75.78, topSeller: 'Carlos Méndez' },
];

export const SALES_CHART_MOCK: readonly SalesChartPoint[] = SALES_REPORT_MOCK.map((row) => ({ label: row.period.slice(0, 3), amount: row.revenue }));

export interface CategoryShare {
  readonly name: string;
  readonly percent: number;
}

export const CATEGORY_SHARE_MOCK: readonly CategoryShare[] = [
  { name: 'Tecnología', percent: 45 },
  { name: 'Audio', percent: 25 },
  { name: 'Gaming', percent: 20 },
  { name: 'Redes', percent: 10 },
];

export interface SellerShare {
  readonly name: string;
  readonly amount: string;
  readonly percent: number;
}

export const SELLER_SHARE_MOCK: readonly SellerShare[] = [
  { name: 'María Torres', amount: 'S/ 28,500.00', percent: 62 },
  { name: 'Luis Ramírez', amount: 'S/ 17,390.00', percent: 38 },
];

export interface TopProductRow {
  readonly id: string;
  readonly rank: number;
  readonly name: string;
  readonly category: string;
  readonly units: number;
  readonly revenue: string;
  readonly margin: string;
}

export const TOP_PRODUCT_MOCK: readonly TopProductRow[] = [
  { id: '1', rank: 1, name: 'Mouse Gamer RGB Pro', category: 'Gaming', units: 120, revenue: 'S/ 11,988.00', margin: '42%' },
  { id: '2', rank: 2, name: 'Teclado Mecánico K70', category: 'Gaming', units: 85, revenue: 'S/ 16,065.00', margin: '38%' },
  { id: '3', rank: 3, name: 'Auriculares Wireless', category: 'Audio', units: 72, revenue: 'S/ 10,728.00', margin: '45%' },
  { id: '4', rank: 4, name: 'Router Dual Band AC1200', category: 'Redes', units: 60, revenue: 'S/ 7,140.00', margin: '35%' },
];

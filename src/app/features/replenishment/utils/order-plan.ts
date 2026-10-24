import { addDays, formatCalendarDate } from '../../../core/regional/regional-format';
import { OrderStatus, StockRiskItem } from '../models/replenishment.model';

export interface OrderDeadline {
  readonly date: string | null;
  readonly label: string;
  readonly overdue: boolean;
}

const STATUS_RANK: Readonly<Record<OrderStatus, number>> = { ORDER_NOW: 0, ORDER_SOON: 1, OK: 2, NO_SALES: 3 };

export function orderStatusOf(item: StockRiskItem): OrderStatus {
  return item.orderStatus ?? 'OK';
}

export function orderDeadline(item: StockRiskItem, today: string): OrderDeadline {
  const status = orderStatusOf(item);
  const days = item.daysToOrder;
  if (days === null || days === undefined) {
    return status === 'ORDER_NOW' ? { date: today, label: 'Hoy', overdue: false } : { date: null, label: '—', overdue: false };
  }
  const offset = Math.floor(days);
  const date = addDays(today, offset);
  if (offset < 0) return { date, label: `Atrasado (${formatCalendarDate(date)})`, overdue: true };
  if (offset === 0) return { date, label: 'Hoy', overdue: false };
  if (offset === 1) return { date, label: `Mañana (${formatCalendarDate(date)})`, overdue: false };
  return { date, label: formatCalendarDate(date), overdue: false };
}

export function byOrderUrgency(a: StockRiskItem, b: StockRiskItem): number {
  const rank = STATUS_RANK[orderStatusOf(a)] - STATUS_RANK[orderStatusOf(b)];
  if (rank !== 0) return rank;
  const days = (a.daysToOrder ?? Number.MAX_SAFE_INTEGER) - (b.daysToOrder ?? Number.MAX_SAFE_INTEGER);
  return days !== 0 ? days : a.name.localeCompare(b.name, 'es');
}

export function whatsappOrderText(order: SupplierOrder, companyName: string): string {
  const lines = order.items.map((item) => `• ${item.orderQuantity ?? 0} uds — ${item.name} (${item.sku})`);
  const from = companyName ? ` para ${companyName}` : '';
  return [`Hola, ${order.supplier}. Quisiera hacer el siguiente pedido${from}:`, '', ...lines, '', '¿Me confirman disponibilidad y fecha de entrega? Gracias.'].join('\n');
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export interface GoodsReceiptPrefill {
  readonly supplierName: string | null;
  readonly notes: string;
  readonly lines: readonly { readonly productId: string; readonly quantity: number; readonly unitCost: number | null }[];
  readonly asOrder?: boolean;
}

export function goodsReceiptPrefill(order: SupplierOrder): GoodsReceiptPrefill {
  return {
    supplierName: order.supplier === 'Sin proveedor asignado' ? null : order.supplier,
    notes: `Pedido generado desde "Qué pedir y cuándo" (${order.items.length} productos).`,
    lines: order.items.map((item) => ({ productId: item.productId, quantity: item.orderQuantity ?? 0, unitCost: item.referenceCost ?? null })),
    asOrder: true,
  };
}

export interface SupplierOrder {
  readonly supplier: string;
  readonly items: readonly StockRiskItem[];
  readonly units: number;
  readonly earliest: string | null;
}

export function needsOrder(item: StockRiskItem): boolean {
  const status = orderStatusOf(item);
  return (status === 'ORDER_NOW' || status === 'ORDER_SOON') && (item.orderQuantity ?? 0) > 0;
}

export function groupBySupplier(items: readonly StockRiskItem[], today: string): readonly SupplierOrder[] {
  const groups = new Map<string, StockRiskItem[]>();
  for (const item of items.filter(needsOrder)) {
    const key = item.supplierName ?? 'Sin proveedor asignado';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([supplier, list]) => {
      const sorted = [...list].sort(byOrderUrgency);
      const dates = sorted.map((item) => orderDeadline(item, today).date).filter((date): date is string => !!date).sort();
      return {
        supplier,
        items: sorted,
        units: sorted.reduce((sum, item) => sum + (item.orderQuantity ?? 0), 0),
        earliest: dates[0] ?? null,
      };
    })
    .sort((a, b) => (a.earliest ?? '9999').localeCompare(b.earliest ?? '9999') || a.supplier.localeCompare(b.supplier, 'es'));
}

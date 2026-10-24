import { formatMoney, formatQuantity } from '../../../core/regional/regional-format';
import { StagnantItem, StockRiskItem } from '../models/replenishment.model';
import { orderStatusOf } from './order-plan';

function days(value: number): string {
  return value === 1 ? '1 día' : `${formatQuantity(value, 1)} días`;
}

function stockText(item: StockRiskItem): string {
  const onOrder = item.onOrder ?? 0;
  return onOrder > 0
    ? `${formatQuantity(item.currentStock)} + ${formatQuantity(onOrder)} en camino`
    : formatQuantity(item.currentStock);
}

export function orderStatusHint(item: StockRiskItem): string | null {
  const status = orderStatusOf(item);
  const point = item.reorderPoint;
  if (point === undefined) return null;
  const daily = formatQuantity(item.averageDailySales, 2);
  switch (status) {
    case 'ORDER_NOW':
      if (item.averageDailySales <= 0) {
        return `Stock ${stockText(item)}: está en el mínimo (${formatQuantity(item.minStock)}) o por debajo, aunque no tuvo ventas recientes.`;
      }
      return `Stock ${stockText(item)}: ya llegó al punto de pedido (${formatQuantity(point)}). Ese punto cubre la venta de ${days(item.leadTimeDays)} de entrega (${daily}/día) más el stock mínimo (${formatQuantity(item.minStock)}).`;
    case 'ORDER_SOON':
      return `Llegará al punto de pedido (${formatQuantity(point)}) en ${days(Math.max(0, Math.ceil(item.daysToOrder ?? 0)))}: vende ${daily}/día y el proveedor tarda ${days(item.leadTimeDays)}.`;
    case 'OK':
      return item.daysToOrder != null
        ? `Tiene stock para ${days(Math.floor(item.daysToOrder))} más antes de llegar al punto de pedido (${formatQuantity(point)}).`
        : `Stock ${stockText(item)}: por encima del punto de pedido (${formatQuantity(point)}).`;
    case 'NO_SALES':
      return `No tuvo ventas en los últimos 30 días y su stock (${stockText(item)}) está por encima del mínimo (${formatQuantity(item.minStock)}).`;
  }
}

export function riskHint(item: StockRiskItem): string | null {
  if (item.risk === 'CRITICAL' && item.coverageDays == null) {
    return item.currentStock <= 0
      ? 'Está sin stock y es un producto que se vende o tiene stock mínimo.'
      : `El stock (${formatQuantity(item.currentStock)}) está en el mínimo (${formatQuantity(item.minStock)}) o por debajo, aunque no tuvo ventas recientes.`;
  }
  if (item.risk === 'NO_SALES' || item.coverageDays == null) {
    return 'No tuvo ventas en los últimos 30 días, así que no se puede calcular cuánto dura el stock.';
  }
  const range = item.risk === 'CRITICAL' ? 'menos de 7 días' : item.risk === 'MODERATE' ? 'entre 7 y 15 días' : 'más de 15 días';
  return `Vende ${formatQuantity(item.averageDailySales, 2)}/día: el stock (${formatQuantity(item.currentStock)}) alcanza para ${days(item.coverageDays)} (${range}).`;
}

export function stagnantHint(item: StagnantItem): string {
  const idle = item.daysWithoutSale != null ? `Lleva ${days(item.daysWithoutSale)} sin venderse` : 'Nunca se vendió';
  return `${item.cause}. ${idle} y tiene ${formatQuantity(item.stock)} unidades inmovilizadas (${formatMoney(item.value)}). Desde 120 días se sugiere liquidar; desde 90, una promoción; antes, revisar el precio.`;
}

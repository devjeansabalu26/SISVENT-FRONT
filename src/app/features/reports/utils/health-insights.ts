import { formatMoney } from '../../../core/regional/regional-format';
import { HealthReport } from '../models/health-report.model';

export type InsightTone = 'success' | 'warning' | 'danger' | 'info';

export interface HealthInsight {
  readonly tone: InsightTone;
  readonly icon: string;
  readonly title: string;
  readonly action: string;
  readonly link?: string;
}

export function healthInsights(report: HealthReport, money: (value: number) => string = formatMoney): readonly HealthInsight[] {
  const list: HealthInsight[] = [];
  const { profit, sales, leaks, dormant, month } = report;

  if (profit.marginPercent !== null && profit.previousMarginPercent !== null) {
    const change = profit.marginPercent - profit.previousMarginPercent;
    if (change <= -2) {
      list.push({
        tone: 'danger', icon: 'trending_down',
        title: `Tu margen bajó de ${profit.previousMarginPercent.toFixed(1)}% a ${profit.marginPercent.toFixed(1)}%.`,
        action: 'Revisa los precios de los productos con más descuento o cuyo costo subió.',
        link: '/app/reports/products',
      });
    } else if (change >= 2) {
      list.push({
        tone: 'success', icon: 'trending_up',
        title: `Tu margen subió de ${profit.previousMarginPercent.toFixed(1)}% a ${profit.marginPercent.toFixed(1)}%.`,
        action: 'Mantén esos precios y cuida que no te falte stock de lo que más ganancia deja.',
      });
    }
  }

  if (sales.deltaPercent !== null && sales.deltaPercent <= -10) {
    list.push({
      tone: 'warning', icon: 'south',
      title: sales.deltaAmount != null ? `Vendiste ${money(Math.abs(sales.deltaAmount))} menos que en el periodo anterior.` : 'Vendiste menos que en el periodo anterior.',
      action: 'Mira en Ventas qué días y horas bajaron y lanza una promoción justo en ese horario.',
      link: '/app/reports/sales',
    });
  } else if (sales.deltaPercent !== null && sales.deltaPercent >= 10) {
    list.push({
      tone: 'success', icon: 'north',
      title: sales.deltaAmount != null ? `Vendiste ${money(sales.deltaAmount)} más que en el periodo anterior.` : 'Vendiste más que en el periodo anterior.',
      action: 'Asegura stock de tus productos estrella para mantener el ritmo.',
    });
  }

  if (sales.value > 0 && leaks.total > 0 && leaks.total / sales.value >= 0.03) {
    list.push({
      tone: 'warning', icon: 'water_drop',
      title: `Se fueron ${money(leaks.total)} en descuentos, anulaciones y faltantes de caja (${((leaks.total / sales.value) * 100).toFixed(1)}% de lo vendido).`,
      action: 'Revisa en Equipo quién da más descuentos o anula más ventas, y en Caja los faltantes.',
      link: '/app/reports/team',
    });
  }

  if (dormant.value > 0) {
    list.push({
      tone: 'info', icon: 'inventory',
      title: `Tienes ${money(dormant.value)} en ${dormant.products} productos que no se venden hace más de ${dormant.days} días.`,
      action: 'Ponlos en oferta o en combo para recuperar ese dinero, y no los vuelvas a comprar por ahora.',
    });
  }

  if (month.projectedDeltaPercent !== null && month.daysElapsed >= 5) {
    const good = month.projectedDeltaPercent >= 0;
    list.push({
      tone: good ? 'success' : 'warning', icon: good ? 'event_available' : 'event_busy',
      title: `Si sigues así, cerrarías el mes en ${money(month.projected)} (${money(Math.abs(month.projected - month.previousMonth))} ${good ? 'más' : 'menos'} que el mes pasado).`,
      action: good
        ? 'Buen ritmo: aprovecha los días fuertes para empujar los productos con mejor margen.'
        : 'Te faltan ventas para igualar el mes pasado: refuerza los días flojos con promociones.',
    });
  }

  if (profit.missingCost) {
    list.push({
      tone: 'info', icon: 'price_change',
      title: 'Algunos productos vendidos no tienen costo registrado y su ganancia no se cuenta.',
      action: 'Completa el costo de referencia en esos productos para ver tu ganancia real.',
      link: '/app/products',
    });
  }

  if (!list.length) {
    list.push({
      tone: 'success', icon: 'thumb_up',
      title: 'Tu negocio se mantiene estable en este periodo.',
      action: 'Sigue revisando este resumen cada semana para detectar cambios a tiempo.',
    });
  }
  return list;
}

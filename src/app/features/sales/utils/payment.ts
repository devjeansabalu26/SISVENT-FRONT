import { CARD_BRANDS, MAX_PAYMENTS, PaymentDraftLine, PaymentKind, PosPaymentLine } from '../models/payment.model';

const round2 = (value: number): number => Math.round(value * 100) / 100;

function parseAmount(text: string): number | null {
  const clean = text.trim().replace(',', '.');
  return clean ? Number(clean) : null;
}

export interface PaymentBreakdown {
  readonly nonCash: number;
  readonly due: number;
  readonly cashReceived: number | null;
  readonly change: number;
  readonly pending: number;
}

export function breakdown(lines: readonly PaymentDraftLine[], kindOf: (code: string) => PaymentKind, total: number): PaymentBreakdown {
  const single = lines.length === 1;
  let nonCash = 0;
  let cashReceived: number | null = null;
  let hasCash = false;
  for (const line of lines) {
    if (kindOf(line.methodCode) === 'CASH') {
      hasCash = true;
      continue;
    }
    const amount = parseAmount(line.amount) ?? (single ? total : 0);
    nonCash += Number.isFinite(amount) ? amount : 0;
  }
  nonCash = round2(nonCash);
  const due = round2(Math.max(0, total - nonCash));
  if (hasCash) {
    const cash = lines.find((line) => kindOf(line.methodCode) === 'CASH')!;
    const received = parseAmount(cash.amountReceived);
    cashReceived = received === null ? due : received;
  }
  const covered = nonCash + (cashReceived !== null && Number.isFinite(cashReceived) ? Math.min(cashReceived, due) : 0);
  return {
    nonCash,
    due,
    cashReceived,
    change: cashReceived !== null && Number.isFinite(cashReceived) ? Math.max(0, round2(cashReceived - due)) : 0,
    pending: round2(Math.max(0, total - covered)),
  };
}

export function paymentsError(lines: readonly PaymentDraftLine[], kindOf: (code: string) => PaymentKind, total: number): string | null {
  if (!lines.length) return 'Agrega un método de pago.';
  if (lines.length > MAX_PAYMENTS) return `Una venta admite hasta ${MAX_PAYMENTS} pagos.`;
  if (lines.filter((line) => kindOf(line.methodCode) === 'CASH').length > 1) return 'Registra el efectivo en un solo pago.';

  const single = lines.length === 1;
  for (const line of lines) {
    const kind = kindOf(line.methodCode);
    if (kind === 'CASH') continue;
    const label = kind === 'CARD' ? 'tarjeta' : 'pago digital';
    const amount = parseAmount(line.amount);
    if (amount === null && !single) return `Indica el monto del pago con ${label}.`;
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) return `El monto del pago con ${label} debe ser mayor a cero.`;
    if (!line.reference.trim()) {
      return kind === 'CARD' ? 'Ingresa el n.º de operación del voucher del POS.' : 'Ingresa el n.º de operación del pago.';
    }
    if (kind === 'CARD' && line.cardLast4.trim() && !/^\d{4}$/.test(line.cardLast4.trim())) {
      return 'Los últimos dígitos de la tarjeta deben ser 4 números.';
    }
  }

  const result = breakdown(lines, kindOf, total);
  if (result.nonCash > round2(total)) return 'Los pagos con tarjeta o digitales superan el total de la venta.';
  const hasCash = lines.some((line) => kindOf(line.methodCode) === 'CASH');
  if (hasCash) {
    if (result.due <= 0) return 'El total ya está cubierto: quita el pago en efectivo.';
    if (result.cashReceived === null || !Number.isFinite(result.cashReceived) || result.cashReceived < 0) {
      return 'Ingresa un monto recibido válido.';
    }
    if (round2(result.cashReceived) < result.due) return `El efectivo no cubre lo que falta (S/ ${result.due.toFixed(2)}).`;
  } else if (result.due > 0) {
    return `Falta cubrir S/ ${result.due.toFixed(2)} del total.`;
  }
  return null;
}

export function toPaymentLines(
  lines: readonly PaymentDraftLine[],
  kindOf: (code: string) => PaymentKind,
  total: number,
): readonly PosPaymentLine[] {
  const due = breakdown(lines, kindOf, total).due;
  return lines.map((line) => {
    const kind = kindOf(line.methodCode);
    if (kind === 'CASH') {
      const received = parseAmount(line.amountReceived);
      return { method: line.methodCode, amountReceived: round2(received ?? due) };
    }
    const amount = parseAmount(line.amount) ?? (lines.length === 1 ? total : 0);
    const reference = line.reference.trim();
    if (kind === 'DIGITAL') return { method: line.methodCode, amount: round2(amount), reference };
    return {
      method: line.methodCode,
      amount: round2(amount),
      reference,
      cardBrand: line.cardBrand || undefined,
      authorizationCode: line.authorizationCode.trim() || undefined,
      cardLast4: line.cardLast4.trim() || undefined,
    };
  });
}

export function quickCashAmounts(due: number): readonly number[] {
  if (due <= 0) return [];
  const bills = [10, 20, 50, 100, 200];
  const rounded = bills.map((bill) => Math.ceil(due / bill) * bill).filter((amount) => amount > due);
  return [round2(due), ...new Set(rounded)].slice(0, 4);
}

interface PaymentSummarySource {
  readonly methodName?: string | null;
  readonly amount?: number | null;
  readonly amountReceived?: number | null;
  readonly changeAmount?: number | null;
  readonly reference?: string | null;
  readonly authorizationCode?: string | null;
  readonly cardBrand?: string | null;
  readonly cardLast4?: string | null;
}

export function paymentSummary(source: PaymentSummarySource): string {
  const parts: string[] = [];
  if (source.methodName) parts.push(source.amount != null ? `${source.methodName} S/ ${source.amount.toFixed(2)}` : source.methodName);
  if (source.amountReceived != null) {
    parts.push(`Recibido S/ ${source.amountReceived.toFixed(2)}`);
    parts.push(`Vuelto S/ ${(source.changeAmount ?? 0).toFixed(2)}`);
  }
  if (source.cardBrand) {
    const brand = CARD_BRANDS.find((item) => item.value === source.cardBrand)?.label ?? source.cardBrand;
    parts.push(source.cardLast4 ? `${brand} •••• ${source.cardLast4}` : brand);
  }
  if (source.reference) parts.push(`Op. ${source.reference}`);
  if (source.authorizationCode) parts.push(`Aut. ${source.authorizationCode}`);
  return parts.join(' · ');
}

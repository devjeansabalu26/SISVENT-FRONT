import { SaleDetail } from '../models/sale-detail.model';
import { currentRegional, formatDateTime, formatMoney, receiptNote } from '../../../core/regional/regional-format';
import { EINVOICE_STATUS_LABEL, documentNumber, isInvoice } from './sale-document';

const WIDTH = 80;
const MARGIN = 5;
const LINE = 4;
const CONTENT = WIDTH - MARGIN * 2;

type Row =
  | { readonly kind: 'text'; readonly text: string; readonly align?: 'left' | 'center'; readonly bold?: boolean; readonly size?: number }
  | { readonly kind: 'pair'; readonly left: string; readonly right: string; readonly bold?: boolean; readonly size?: number }
  | { readonly kind: 'rule' }
  | { readonly kind: 'space' };

const LOGO_MAX_W = 40;
const LOGO_MAX_H = 18;
const DEFAULT_FOOTER = '¡Gracias por su compra!';

interface ReceiptLogo {
  readonly data: string;
  readonly format: string;
  readonly width: number;
  readonly height: number;
}

export function receiptFooter(sale: SaleDetail): string {
  return sale.receipt?.footer?.trim() || DEFAULT_FOOTER;
}

const money = (value: number): string => formatMoney(value);
const quantity = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(2));

export function receiptRows(sale: SaleDetail, companyName: string): readonly Row[] {
  const date = formatDateTime(sale.saleDate);
  const invoice = isInvoice(sale);
  const rows: Row[] = [
    { kind: 'text', text: companyName, align: 'center', bold: true, size: 11 },
    { kind: 'text', text: invoice ? 'FACTURA' : 'Comprobante interno de venta', align: 'center' },
    { kind: 'text', text: documentNumber(sale), align: 'center', bold: true },
    { kind: 'rule' },
    { kind: 'pair', left: 'Fecha', right: date },
    { kind: 'pair', left: 'Local', right: sale.storeName },
  ];
  if (invoice) {
    rows.push(
      { kind: 'pair', left: 'RUC', right: sale.customerTaxId ?? '' },
      { kind: 'text', text: sale.customerLegalName ?? '' },
    );
    if (sale.customerAddress) rows.push({ kind: 'text', text: sale.customerAddress });
    rows.push({ kind: 'pair', left: 'Venta interna', right: sale.saleNumber });
  } else {
    rows.push({ kind: 'pair', left: 'Cliente', right: sale.clientName ?? 'Cliente general' });
  }
  rows.push({ kind: 'pair', left: 'Vendedor', right: sale.sellerName });
  if (sale.status === 'CANCELLED') rows.push({ kind: 'text', text: '*** VENTA ANULADA ***', align: 'center', bold: true });
  rows.push({ kind: 'rule' });

  for (const line of sale.lines) {
    rows.push({ kind: 'text', text: line.productName, bold: true });
    rows.push({ kind: 'pair', left: `${quantity(line.quantity)} x ${money(line.unitPrice)}`, right: money(line.subtotal) });
    if (line.discountAmount > 0) rows.push({ kind: 'pair', left: '  Descuento', right: `-${money(line.discountAmount)}` });
  }

  rows.push(
    { kind: 'rule' },
    { kind: 'pair', left: 'Subtotal', right: money(sale.subtotal) },
    { kind: 'pair', left: 'Descuento', right: `-${money(sale.discountTotal)}` },
    ...(invoice
      ? [
          { kind: 'pair', left: 'Op. gravada', right: money(sale.total - sale.tax) } as const,
          { kind: 'pair', left: currentRegional().taxName, right: money(sale.tax) } as const,
        ]
      : [{ kind: 'pair', left: `${currentRegional().taxName} (referencial)`, right: money(sale.tax) } as const]),
    { kind: 'pair', left: 'TOTAL', right: money(sale.total), bold: true, size: 11 },
    { kind: 'rule' },
    { kind: 'text', text: 'Pagos', bold: true },
  );

  const payments = sale.payments ?? [];
  if (!payments.length) rows.push({ kind: 'pair', left: sale.paymentMethod, right: money(sale.total) });
  for (const payment of payments) {
    rows.push({ kind: 'pair', left: payment.methodName, right: money(payment.amount) });
    if (payment.amountReceived != null) {
      rows.push({ kind: 'pair', left: '  Recibido', right: money(payment.amountReceived) });
      rows.push({ kind: 'pair', left: '  Vuelto', right: money(payment.changeAmount ?? 0) });
    }
    if (payment.cardBrand) {
      rows.push({ kind: 'pair', left: '  Tarjeta', right: payment.cardLast4 ? `${payment.cardBrand} **** ${payment.cardLast4}` : payment.cardBrand });
    }
    if (payment.reference) rows.push({ kind: 'pair', left: '  N.º operación', right: payment.reference });
    if (payment.authorizationCode) rows.push({ kind: 'pair', left: '  Autorización', right: payment.authorizationCode });
  }

  rows.push(
    { kind: 'rule' },
    { kind: 'text', text: receiptFooter(sale), align: 'center', bold: true },
    {
      kind: 'text',
      text: invoice ? (EINVOICE_STATUS_LABEL[sale.eInvoiceStatus ?? ''] ?? 'Factura') : receiptNote(),
      align: 'center',
      size: 7,
    },
  );
  return rows;
}

export async function downloadReceiptPdf(sale: SaleDetail, companyName: string): Promise<void> {
  (await buildReceiptPdf(sale, companyName)).save(`comprobante-${documentNumber(sale)}.pdf`);
}

export async function receiptPdfBase64(sale: SaleDetail, companyName: string): Promise<string> {
  const dataUri = (await buildReceiptPdf(sale, companyName)).output('datauristring');
  return dataUri.slice(dataUri.indexOf(',') + 1);
}

async function buildReceiptPdf(sale: SaleDetail, companyName: string) {
  const { jsPDF } = await import('jspdf');
  const rows = receiptRows(sale, companyName);
  const logo = sale.receipt?.logoUrl ? await loadLogo(sale.receipt.logoUrl) : null;
  const logoHeight = logo ? logo.height + 3 : 0;

  const measure = new jsPDF({ unit: 'mm', format: [WIDTH, 200] });
  const wrap = (text: string, size = 8, bold = false, width = CONTENT): string[] => {
    measure.setFont('helvetica', bold ? 'bold' : 'normal');
    measure.setFontSize(size);
    return measure.splitTextToSize(text, width) as string[];
  };
  const heightOf = (row: Row): number => {
    switch (row.kind) {
      case 'rule':
        return LINE;
      case 'space':
        return LINE / 2;
      case 'text':
        return wrap(row.text, row.size, row.bold).length * LINE;
      case 'pair':
        return wrap(row.right, row.size, row.bold, CONTENT * 0.6).length * LINE;
    }
  };
  const height = Math.max(100, MARGIN * 2 + logoHeight + rows.reduce((sum, row) => sum + heightOf(row), 0));

  const doc = new jsPDF({ unit: 'mm', format: [WIDTH, height] });
  let y = MARGIN + 3;
  if (logo) {
    doc.addImage(logo.data, logo.format, (WIDTH - logo.width) / 2, MARGIN, logo.width, logo.height);
    y += logoHeight;
  }
  for (const row of rows) {
    const size = 'size' in row && row.size ? row.size : 8;
    const bold = 'bold' in row && !!row.bold;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    switch (row.kind) {
      case 'rule':
        doc.setLineDashPattern([0.8, 0.8], 0);
        doc.line(MARGIN, y - 1.5, WIDTH - MARGIN, y - 1.5);
        y += LINE;
        break;
      case 'space':
        y += LINE / 2;
        break;
      case 'text': {
        const lines = doc.splitTextToSize(row.text, CONTENT) as string[];
        const x = row.align === 'center' ? WIDTH / 2 : MARGIN;
        doc.text(lines, x, y, { align: row.align === 'center' ? 'center' : 'left' });
        y += lines.length * LINE;
        break;
      }
      case 'pair': {
        const right = doc.splitTextToSize(row.right, CONTENT * 0.6) as string[];
        doc.text(row.left, MARGIN, y);
        doc.text(right, WIDTH - MARGIN, y, { align: 'right' });
        y += right.length * LINE;
        break;
      }
    }
  }
  return doc;
}

async function loadLogo(url: string): Promise<ReceiptLogo | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('logo'));
      element.src = source;
    });
    if (!image.naturalWidth || !image.naturalHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const scale = Math.min(LOGO_MAX_W / image.naturalWidth, LOGO_MAX_H / image.naturalHeight);
    return { data: canvas.toDataURL('image/png'), format: 'PNG', width: image.naturalWidth * scale, height: image.naturalHeight * scale };
  } catch {
    return null;
  }
}

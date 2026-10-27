import { documentNumber, documentTitle, isInvoice, isValidRuc } from './sale-document';

describe('sale document', () => {
  it('validates the RUC check digit', () => {
    expect(isValidRuc('20123456786')).toBeTrue();
    expect(isValidRuc(' 20123456786 ')).toBeTrue();
    expect(isValidRuc('20123456780')).toBeFalse();
    expect(isValidRuc('2012345678')).toBeFalse();
    expect(isValidRuc('2012345678A')).toBeFalse();
  });

  it('uses the invoice number only for facturas', () => {
    const boleta = { saleNumber: 'V-20261026-0001', documentType: 'BOLETA' as const, documentNumber: null };
    const factura = { saleNumber: 'V-20261026-0002', documentType: 'FACTURA' as const, documentNumber: 'F001-00000001' };
    expect(isInvoice(boleta)).toBeFalse();
    expect(documentNumber(boleta)).toBe('V-20261026-0001');
    expect(documentTitle(boleta)).toBe('COMPROBANTE DE VENTA');
    expect(isInvoice(factura)).toBeTrue();
    expect(documentNumber(factura)).toBe('F001-00000001');
    expect(documentTitle(factura)).toBe('FACTURA');
  });
});

import { auditFieldLabel } from './audit-field-label';

describe('auditFieldLabel', () => {
  it('translates known fields regardless of casing', () => {
    expect(auditFieldLabel('SalePrice')).toBe('Precio de venta');
    expect(auditFieldLabel('isActive')).toBe('Activo');
    expect(auditFieldLabel('stockAfter')).toBe('Stock resultante');
  });

  it('splits unknown camelCase or snake_case names', () => {
    expect(auditFieldLabel('ticketFormat')).toBe('Ticket format');
    expect(auditFieldLabel('show_logo_on_receipt')).toBe('Show logo on receipt');
  });
});

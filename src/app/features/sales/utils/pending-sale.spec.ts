import { TimeoutError } from 'rxjs';
import { AppHttpError } from '../../../core/http/models/app-http-error.model';
import { PosSaleRequest } from '../data-access/pos-api.service';
import { isUncertainSaleFailure, pendingSaleFor } from './pending-sale';

describe('pending-sale', () => {
  const body = (quantity: number, sellerCode = '12345'): PosSaleRequest => ({
    storeId: 's1',
    sellerCode,
    clientId: null,
    paymentMethod: 'CASH',
    discountTotal: 0,
    notes: null,
    lines: [{ productId: 'p1', quantity, discountAmount: 0 }],
    payments: [{ method: 'CASH', amount: 10 }],
  });
  let counter = 0;
  const newKey = () => `key-${++counter}`;

  it('reutiliza la clave cuando se reintenta la misma operación', () => {
    const first = pendingSaleFor(null, body(1), newKey);
    const retry = pendingSaleFor(first, body(1), newKey);
    expect(retry.key).toBe(first.key);
  });

  it('reutiliza la clave aunque se vuelva a digitar otro código de vendedor', () => {
    const first = pendingSaleFor(null, body(1, '11111'), newKey);
    const retry = pendingSaleFor(first, body(1, '22222'), newKey);
    expect(retry.key).toBe(first.key);
  });

  it('genera una clave nueva cuando cambia el carrito', () => {
    const first = pendingSaleFor(null, body(1), newKey);
    const changed = pendingSaleFor(first, body(2), newKey);
    expect(changed.key).not.toBe(first.key);
  });

  it('genera una clave nueva cuando no hay operación pendiente', () => {
    const first = pendingSaleFor(null, body(1), newKey);
    const next = pendingSaleFor(null, body(1), newKey);
    expect(next.key).not.toBe(first.key);
  });

  it('considera incierto el error de red, el 5xx y el tiempo de espera', () => {
    expect(isUncertainSaleFailure(new AppHttpError('network', 0, ''))).toBeTrue();
    expect(isUncertainSaleFailure(new AppHttpError('server', 503, ''))).toBeTrue();
    expect(isUncertainSaleFailure(new TimeoutError())).toBeTrue();
  });

  it('considera definitivo el rechazo de negocio', () => {
    expect(isUncertainSaleFailure(new AppHttpError('conflict', 409, ''))).toBeFalse();
    expect(isUncertainSaleFailure(new AppHttpError('validation', 400, ''))).toBeFalse();
  });
});

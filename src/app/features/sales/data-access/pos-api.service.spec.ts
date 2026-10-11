import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PosApiService, PosSaleRequest } from './pos-api.service';

describe('PosApiService', () => {
  const body: PosSaleRequest = {
    storeId: null,
    sellerCode: '12345',
    clientId: null,
    paymentMethod: 'CASH',
    discountTotal: 0,
    notes: null,
    lines: [{ productId: 'p1', quantity: 1, discountAmount: 0 }],
    payments: [{ method: 'CASH', amount: 10 }],
  };

  it('envía la clave de idempotencia en la cabecera al confirmar la venta', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(PosApiService);
    const http = TestBed.inject(HttpTestingController);

    api.confirm(body, 'clave-123').subscribe();

    const request = http.expectOne((r) => r.url.endsWith('/api/v1/pos/sales'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('clave-123');
    expect(request.request.body).toEqual(body);
    request.flush({});
    http.verify();
  });
});

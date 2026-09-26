import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let storage: TokenStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    storage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => sessionStorage.clear());

  it('keeps a token without expiration until logout', () => {
    storage.set('token-sin-expiracion', null);
    expect(storage.getToken()).toBe('token-sin-expiracion');
    storage.clear();
    expect(storage.getToken()).toBeNull();
  });

  it('discards an expired token', () => {
    storage.set('token-vencido', new Date(Date.now() - 1000).toISOString());
    expect(storage.getToken()).toBeNull();
  });

  it('keeps a token that has not expired yet', () => {
    storage.set('token-vigente', new Date(Date.now() + 60_000).toISOString());
    expect(storage.getToken()).toBe('token-vigente');
  });

  it('forgets a previous expiration when the new login has none', () => {
    storage.set('viejo', new Date(Date.now() - 1000).toISOString());
    storage.set('nuevo', null);
    expect(storage.getToken()).toBe('nuevo');
  });
});

import { whatsappLink, whatsappNumber } from './whatsapp-link';

describe('whatsappNumber', () => {
  it('adds the country calling code to a local Peruvian cell phone', () => {
    expect(whatsappNumber('987 654 321', 'PE')).toBe('51987654321');
  });

  it('keeps a number written in international format', () => {
    expect(whatsappNumber('+51 987-654-321', 'PE')).toBe('51987654321');
  });

  it('ignores missing or too short phones', () => {
    expect(whatsappNumber(null, 'PE')).toBeNull();
    expect(whatsappNumber('123', 'PE')).toBeNull();
  });
});

describe('whatsappLink', () => {
  it('builds a wa.me link with the encoded message', () => {
    expect(whatsappLink('987654321', 'PE', 'Hola Ana')).toBe('https://wa.me/51987654321?text=Hola%20Ana');
  });
});

import { timeAgo } from './notifications-page';

describe('timeAgo', () => {
  const now = new Date('2026-09-26T18:00:00Z');
  const minus = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

  it('uses relative text for recent events', () => {
    expect(timeAgo(minus(0), now)).toBe('Hace un momento');
    expect(timeAgo(minus(1), now)).toBe('Hace 1 minuto');
    expect(timeAgo(minus(5), now)).toBe('Hace 5 minutos');
    expect(timeAgo(minus(60), now)).toBe('Hace 1 hora');
    expect(timeAgo(minus(180), now)).toBe('Hace 3 horas');
  });

  it('switches to "Ayer" and then to a date', () => {
    expect(timeAgo(minus(30 * 60), now)).toMatch(/^Ayer, /);
    expect(timeAgo(minus(5 * 24 * 60), now)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

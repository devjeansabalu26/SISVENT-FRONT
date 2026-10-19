import { quickCashAmounts } from '../../features/sales/utils/payment';
import {
  addDays,
  companyToday,
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTime,
  moneyStep,
  receiptNote,
  roundMoney,
  setRegional,
} from './regional-format';
import { CompanyRegional, PERU_REGIONAL } from './regional.model';

const COLOMBIA: CompanyRegional = {
  ...PERU_REGIONAL,
  countryCode: 'CO',
  countryName: 'Colombia',
  currencyCode: 'COP',
  currencySymbol: '$',
  currencyDecimals: 0,
  locale: 'es-CO',
  timezone: 'America/Bogota',
  taxName: 'IVA',
  taxRate: 0.19,
  taxIdName: 'NIT',
  eInvoicingAuthority: 'DIAN',
};

describe('regional format', () => {
  afterEach(() => setRegional(PERU_REGIONAL));

  it('formats money with the symbol, decimals and separators of each company', () => {
    expect(formatMoney(1234.5)).toBe('S/ 1,234.50');
    expect(formatMoney(150000, COLOMBIA)).toBe('$ 150.000');
    expect(formatMoney(null)).toBe('—');
  });

  it('rounds to the currency decimals away from zero', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(999.5, COLOMBIA)).toBe(1000);
    expect(moneyStep(COLOMBIA)).toBe('1');
    expect(moneyStep()).toBe('0.01');
  });

  it('shows dates and times in the company time zone, not the browser one', () => {
    const instant = '2026-10-03T02:34:00Z';
    expect(formatDateTime(instant)).toBe('02/10/2026 21:34');
    expect(formatTime(instant, { ...PERU_REGIONAL, timezone: 'Asia/Tokyo' })).toBe('11:34');
    expect(formatDate(instant, { ...PERU_REGIONAL, dateFormat: 'MM/DD/YYYY' })).toBe('10/02/2026');
  });

  it('keeps calendar dates as they are and does calendar math without time zones', () => {
    expect(formatCalendarDate('2026-10-02')).toBe('02/10/2026');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(companyToday(PERU_REGIONAL, new Date('2026-10-03T03:00:00Z'))).toBe('2026-10-02');
  });

  it('names the electronic invoicing authority of the country', () => {
    expect(receiptNote()).toContain('SUNAT');
    expect(receiptNote(COLOMBIA)).toContain('DIAN');
  });

  it('suggests cash bills that exist in each currency', () => {
    expect(quickCashAmounts(36)).toEqual([36, 40, 50, 100]);
    setRegional(COLOMBIA);
    expect(quickCashAmounts(3000)).toEqual([3000, 4000, 5000, 10000]);
  });
});

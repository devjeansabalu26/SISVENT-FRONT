import { documentLengthHint, documentLengthRule } from './document-types';
import { PERU_DOCUMENT_TYPES } from './regional.model';

const type = (code: string) => PERU_DOCUMENT_TYPES.find((item) => item.code === code);

describe('document length rules', () => {
  it('reads the length from each document pattern', () => {
    expect(documentLengthRule(type('DNI'))).toEqual({ min: 8, max: 8, digitsOnly: true });
    expect(documentLengthRule(type('RUC'))).toEqual({ min: 11, max: 11, digitsOnly: true });
    expect(documentLengthRule(type('CE'))).toEqual({ min: 6, max: 12, digitsOnly: false });
    expect(documentLengthRule(undefined)).toEqual({ min: 1, max: 30, digitsOnly: false });
  });

  it('explains what is missing', () => {
    expect(documentLengthHint(type('DNI'), '1234')).toBe('4/8: faltan 4 dígitos (debe tener 8 dígitos).');
    expect(documentLengthHint(type('DNI'), '12345678')).toBeNull();
    expect(documentLengthHint(type('CE'), 'AB1')).toBe('3/12: faltan 3 caracteres (debe tener entre 6 y 12 caracteres).');
    expect(documentLengthHint(type('RUC'), '')).toBeNull();
  });
});

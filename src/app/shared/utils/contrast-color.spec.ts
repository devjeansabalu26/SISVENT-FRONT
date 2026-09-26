import { contrastRatio, ensureContrast, mixColors } from './contrast-color';

describe('contrast-color', () => {
  it('computes WCAG contrast ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('nope', '#FFFFFF')).toBeNull();
  });

  it('mixes colors', () => {
    expect(mixColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixColors('#0F172A', '#FFFFFF', 0)).toBe('#0F172A');
  });

  it('keeps a readable color untouched', () => {
    expect(ensureContrast('#38BDF8', '#0F172A')).toBe('#38BDF8');
  });

  it('lightens the company purple just enough on a dark sidebar (JEAN SAC)', () => {
    expect(contrastRatio('#7C3AED', '#0F172A')!).toBeLessThan(4.5);
    const accent = ensureContrast('#7C3AED', '#0F172A')!;
    expect(accent).not.toBe('#7C3AED');
    expect(accent).not.toBe('#FFFFFF');
    expect(contrastRatio(accent, '#0F172A')!).toBeGreaterThanOrEqual(4.5);
  });

  it('darkens a light accent on a light sidebar', () => {
    const accent = ensureContrast('#C084FC', '#F3F4F6')!;
    expect(contrastRatio(accent, '#F3F4F6')!).toBeGreaterThanOrEqual(4.5);
  });
});

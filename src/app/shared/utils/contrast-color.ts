function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function prefersDarkTextOn(backgroundHex: string): boolean | null {
  const luminance = relativeLuminance(backgroundHex);
  return luminance === null ? null : luminance > 0.5;
}

export function contrastRatio(aHex: string, bHex: string): number | null {
  const a = relativeLuminance(aHex);
  const b = relativeLuminance(bHex);
  if (a === null || b === null) return null;
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

export function mixColors(hex: string, targetHex: string, amount: number): string | null {
  const from = hexToRgb(hex);
  const to = hexToRgb(targetHex);
  if (!from || !to) return null;
  const channel = (a: number, b: number) => Math.round(a + (b - a) * amount).toString(16).padStart(2, '0');
  return `#${channel(from.r, to.r)}${channel(from.g, to.g)}${channel(from.b, to.b)}`.toUpperCase();
}

export function ensureContrast(foregroundHex: string, backgroundHex: string, minRatio = 4.5): string | null {
  const current = contrastRatio(foregroundHex, backgroundHex);
  if (current === null) return null;
  if (current >= minRatio) return foregroundHex.toUpperCase();
  const target = prefersDarkTextOn(backgroundHex) ? '#000000' : '#FFFFFF';
  for (let amount = 0.05; amount < 1; amount += 0.05) {
    const candidate = mixColors(foregroundHex, target, amount)!;
    if ((contrastRatio(candidate, backgroundHex) ?? 0) >= minRatio) return candidate;
  }
  return target;
}

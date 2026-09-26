/**
 * Utilidad de contraste por luminancia (WCAG relative luminance) para elegir texto claro u oscuro
 * sobre un fondo arbitrario (p.ej. el secondaryColor de una empresa para el sidebar). No asume
 * siempre blanco: si el color de fondo es claro, usa texto oscuro.
 */

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

/** true si conviene texto oscuro sobre este fondo (fondo claro); false si conviene texto claro. */
export function prefersDarkTextOn(backgroundHex: string): boolean | null {
  const luminance = relativeLuminance(backgroundHex);
  return luminance === null ? null : luminance > 0.5;
}

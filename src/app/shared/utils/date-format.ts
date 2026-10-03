/** Formateo de fechas centralizado: nunca mostrar un ISO crudo (2026-09-10T04:31:58...) en pantalla. */

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** "10/09/2026 04:31" (fecha + hora, minutos, sin segundos ni ISO). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "10/09/2026" (solo fecha). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "2026-10-02" en la hora local (no UTC). Para filtros por día y nombres de archivo. */
export function localIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

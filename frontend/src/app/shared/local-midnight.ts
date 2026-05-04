/**
 * Ventana diaria local: misma referencia temporal que la oferta de la tienda
 * y la renovación de la partida diaria.
 */

export function msUntilLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdownHms(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** YYYY-MM-DD en calendario local (para saber si ya se jugó hoy). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

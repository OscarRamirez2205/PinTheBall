
export function msUntilLocalMidnight(ahora: Date = new Date()): number {
  const siguienteMedianoche = new Date(ahora);
  siguienteMedianoche.setDate(siguienteMedianoche.getDate() + 1);
  siguienteMedianoche.setHours(0, 0, 0, 0);
  return Math.max(0, siguienteMedianoche.getTime() - ahora.getTime());
}

export function formatCountdownHms(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** YYYY-MM-DD en calendario local (para saber si ya se jugó hoy). */
export function localDateKey(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const mo = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dia}`;
}

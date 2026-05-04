/** Inicio del lunes de la semana ISO-local que contiene `ref` (semana lunes → domingo). */
export function startOfWeekMondayLocal(ref: Date = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const dow = d.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeekSundayLocal(weekStartMonday: Date): Date {
  const d = new Date(weekStartMonday);
  d.setDate(d.getDate() + 6);
  return d;
}

/** Texto tipo: "28 abr – 4 may 2026" para la semana en curso. */
export function formatWeekRangeEs(weekStartMonday: Date): string {
  const end = endOfWeekSundayLocal(weekStartMonday);
  const startOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const start = weekStartMonday.toLocaleDateString('es-ES', startOpts);
  const endPart = end.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${start} – ${endPart}`;
}

export function startOfWeekMondayLocal(referencia: Date = new Date()): Date {
  const fecha = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const diaSemana = fecha.getDay();
  const desfase = diaSemana === 0 ? -6 : 1 - diaSemana;
  fecha.setDate(fecha.getDate() + desfase);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

export function endOfWeekSundayLocal(inicioLunesSemana: Date): Date {
  const fecha = new Date(inicioLunesSemana);
  fecha.setDate(fecha.getDate() + 6);
  return fecha;
}

/** Estructura del texto: "DIA-LUNES MES – DIA-DOMINGO MES AÑO" */
export function formatWeekRangeEs(inicioLunesSemana: Date): string {
  const finSemana = endOfWeekSundayLocal(inicioLunesSemana);
  const opcionesInicio: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const textoInicio = inicioLunesSemana.toLocaleDateString('es-ES', opcionesInicio);
  const textoFin = finSemana.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${textoInicio} – ${textoFin}`;
}

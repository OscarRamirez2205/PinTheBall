/** Día local `YYYY-MM-DD` */
export function localDateKey(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function gamesToDaySet(partidas: { played_at: string }[]): Set<string> {
  const diasConPartida = new Set<string>();
  for (const partida of partidas) {
    if (!partida.played_at) continue;
    diasConPartida.add(localDateKey(new Date(partida.played_at)));
  }
  return diasConPartida;
}

/** Racha actual: días consecutivos con al menos una partida, contando desde hoy o desde ayer si hoy aún no jugó. */
export function currentPlayStreak(diasConPartida: Set<string>): number {
  if (diasConPartida.size === 0) return 0;
  let racha = 0;
  const cursor = new Date();
  if (!diasConPartida.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (diasConPartida.has(localDateKey(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

/** Mayor número de días consecutivos jugados en el historial. */
export function longestPlayStreak(diasConPartida: Set<string>): number {
  if (diasConPartida.size === 0) return 0;
  const fechasOrdenadas = [...diasConPartida].sort();
  let mejorRacha = 1;
  let rachaSeguida = 1;
  for (let indice = 1; indice < fechasOrdenadas.length; indice++) {
    const anterior = new Date(fechasOrdenadas[indice - 1] + 'T12:00:00').getTime();
    const siguiente = new Date(fechasOrdenadas[indice] + 'T12:00:00').getTime();
    const difDias = Math.round((siguiente - anterior) / 86_400_000);
    if (difDias === 1) {
      rachaSeguida++;
      mejorRacha = Math.max(mejorRacha, rachaSeguida);
    } else {
      rachaSeguida = 1;
    }
  }
  return mejorRacha;
}

/** Últimos `n` días (índice 0 = hace n-1 días, último = hoy): si hubo partida. */
export function lastNDaysPlayFlags(diasConPartida: Set<string>, n: number): boolean[] {
  const marcas: boolean[] = [];
  const hoy = new Date();
  for (let offset = n - 1; offset >= 0; offset--) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() - offset);
    marcas.push(diasConPartida.has(localDateKey(dia)));
  }
  return marcas;
}

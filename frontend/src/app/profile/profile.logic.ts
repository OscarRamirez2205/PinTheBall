/** Día local `YYYY-MM-DD` */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function gamesToDaySet(games: { played_at: string }[]): Set<string> {
  const s = new Set<string>();
  for (const g of games) {
    if (!g.played_at) continue;
    s.add(localDateKey(new Date(g.played_at)));
  }
  return s;
}

/** Racha actual: días consecutivos con al menos una partida, contando desde hoy o desde ayer si hoy aún no jugó. */
export function currentPlayStreak(daySet: Set<string>): number {
  if (daySet.size === 0) return 0;
  let streak = 0;
  const d = new Date();
  if (!daySet.has(localDateKey(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (daySet.has(localDateKey(new Date(d)))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Mayor número de días consecutivos jugados en el historial. */
export function longestPlayStreak(daySet: Set<string>): number {
  if (daySet.size === 0) return 0;
  const sorted = [...daySet].sort();
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1] + 'T12:00:00').getTime();
    const b = new Date(sorted[i] + 'T12:00:00').getTime();
    const diffDays = Math.round((b - a) / 86_400_000);
    if (diffDays === 1) {
      run++;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }
  return maxRun;
}

/** Últimos `n` días (índice 0 = hace n-1 días, último = hoy): si hubo partida. */
export function lastNDaysPlayFlags(daySet: Set<string>, n: number): boolean[] {
  const out: boolean[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(today);
    x.setDate(x.getDate() - i);
    out.push(daySet.has(localDateKey(x)));
  }
  return out;
}

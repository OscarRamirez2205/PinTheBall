export interface LeaderboardRow {
  rank: number;
  playerName: string;
  score: number;
  isYou?: boolean;
}

export type LeaderboardListItem =
  | { kind: 'row'; row: LeaderboardRow }
  | { kind: 'gap'; ariaLabel: string };

/**
 * Ordena por puntuación descendente y asigna rank 1..n.
 */
export function assignRanks(rows: LeaderboardRow[]): LeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

/**
 * Top `topN` y, si el jugador marcado con `isYou` no está entre ellos, un hueco y su fila con rango real.
 */
export function buildTopNPlusOverflow(rankedRows: LeaderboardRow[], topN = 10): LeaderboardListItem[] {
  const top = rankedRows.filter((r) => r.rank <= topN);
  const you = rankedRows.find((r) => r.isYou);

  const items: LeaderboardListItem[] = top.map((row) => ({ kind: 'row', row }));

  if (you && you.rank > topN) {
    items.push({
      kind: 'gap',
      ariaLabel: 'Posiciones entre el top y tu clasificación',
    });
    items.push({ kind: 'row', row: you });
  }

  return items;
}

/** Demo: suficientes jugadores ficticios para que «Tú» quede en `youRank` (≥1). */
export function mockPoolYouAtRank(youRank: number, namePrefix: string): LeaderboardRow[] {
  const n = Math.max(youRank, 10);
  const rows: LeaderboardRow[] = [];
  for (let i = 1; i <= n; i++) {
    if (i === youRank) {
      rows.push({
        rank: 0,
        playerName: 'Tú',
        score: 1_000_000 - i * 100 - 5_000,
        isYou: true,
      });
      continue;
    }
    rows.push({
      rank: 0,
      playerName: `${namePrefix}_${i}`,
      score: 1_000_000 - i * 100,
    });
  }
  return assignRanks(rows);
}

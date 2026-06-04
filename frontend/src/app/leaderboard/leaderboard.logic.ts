export interface LeaderboardRow {
  rank: number;
  playerName: string;
  score: number;
  isYou?: boolean;
}

export type LeaderboardListItem =
  | { kind: 'row'; row: LeaderboardRow }
  | { kind: 'gap'; ariaLabel: string };

/** Ordena por puntuación y asigna rank 1..n. */
export function assignRanks(rows: LeaderboardRow[]): LeaderboardRow[] {
  const ordenadas = [...rows].sort((a, b) => b.score - a.score);
  return ordenadas.map((row, indice) => ({
    ...row,
    rank: indice + 1,
  }));
}

/** Top N filas; si no estás en el top, hueco + tu fila. */
export function buildTopNPlusOverflow(rankedRows: LeaderboardRow[], topN = 10): LeaderboardListItem[] {
  const primeras = rankedRows.filter((row) => row.rank <= topN);
  const tuFila = rankedRows.find((row) => row.isYou);

  const lista: LeaderboardListItem[] = primeras.map((row) => ({ kind: 'row', row }));

  if (tuFila && tuFila.rank > topN) {
    lista.push({
      kind: 'gap',
      ariaLabel: 'Posiciones entre el top y tu clasificación',
    });
    lista.push({ kind: 'row', row: tuFila });
  }

  return lista;
}

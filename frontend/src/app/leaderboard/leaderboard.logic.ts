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
  const ordenadas = [...rows].sort((a, b) => b.score - a.score);
  return ordenadas.map((row, indice) => ({
    ...row,
    rank: indice + 1,
  }));
}

/**
 * Top `topN` y, si el jugador marcado con `isYou` no está entre ellos, un hueco y su fila con rango real.
 */
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

/** Demo: jugadores ficticios para para comprobar estilos y funcionalidades */
export function mockPoolYouAtRank(youRank: number, namePrefix: string): LeaderboardRow[] {
  const cantidad = Math.max(youRank, 10);
  const filas: LeaderboardRow[] = [];
  for (let indice = 1; indice <= cantidad; indice++) {
    if (indice === youRank) {
      filas.push({
        rank: 0,
        playerName: 'Tú',
        score: 1_000_000 - indice * 100 - 5_000,
        isYou: true,
      });
      continue;
    }
    filas.push({
      rank: 0,
      playerName: `${namePrefix}_${indice}`,
      score: 1_000_000 - indice * 100,
    });
  }
  return assignRanks(filas);
}

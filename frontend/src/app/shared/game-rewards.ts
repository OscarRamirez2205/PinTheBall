/** Monedas ganadas: puntos del juego ÷ 1000, redondeado a la baja. */
export function coinsFromScore(rawScore: number): number {
  return Math.floor(Math.max(0, rawScore) / 1000);
}

/**
 * Misma lógica que el backend: día UTC desde epoch, índice sobre ids ordenados.
 */
export function featuredBallId(sortedIds: number[]): number | null {
  if (sortedIds.length === 0) return null;
  const epochDay = Math.floor(Date.now() / 1000 / 86400);
  return sortedIds[epochDay % sortedIds.length] ?? null;
}

export function fallbackDealPrice(normalPrice: number): number {
  return normalPrice > 0 ? Math.max(99, Math.floor(normalPrice * 0.55)) : 0;
}

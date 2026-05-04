
export function featuredBallId(idsOrdenados: number[]): number | null {
  if (idsOrdenados.length === 0) return null;
  const diaDesdeEpoca = Math.floor(Date.now() / 1000 / 86400);
  return idsOrdenados[diaDesdeEpoca % idsOrdenados.length] ?? null;
}

export function fallbackDealPrice(precioNormal: number): number {
  return precioNormal > 0 ? Math.max(99, Math.floor(precioNormal * 0.55)) : 0;
}

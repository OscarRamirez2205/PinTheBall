
/** Oferta del día: misma bola para todos según el día del calendario. */
export function featuredBallId(idsOrdenados: number[]): number | null {
  if (idsOrdenados.length === 0) return null;
  const diaDesdeEpoca = Math.floor(Date.now() / 1000 / 86400);
  return idsOrdenados[diaDesdeEpoca % idsOrdenados.length] ?? null;
}

/** Precio rebajado si la API no envía deal_price. */
export function fallbackDealPrice(precioNormal: number): number {
  return precioNormal > 0 ? Math.max(99, Math.floor(precioNormal * 0.55)) : 0;
}

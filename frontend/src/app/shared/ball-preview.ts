/** Demo: Gradiantes de las bola hasta que sepa que voy ha hacer */
export function ballPreviewGradient(id: number): string {
  const paleta = [
    'radial-gradient(circle at 32% 28%, #ffffff 0%, #e8e8e8 18%, #ffea1c 42%, #ff00fa 78%, #0d0221 100%)',
    'radial-gradient(circle at 30% 30%, #ffb8f9 0%, #ff00fa 45%, #5c0d4a 72%, #0d0221 100%)',
    'radial-gradient(circle at 35% 25%, #bfffff 0%, #1bf9fb 40%, #087a82 70%, #0d0221 100%)',
    'radial-gradient(circle at 40% 35%, #fff6a8 0%, #ff6c11 38%, #ff00fa 72%, #261447 100%)',
    'radial-gradient(circle at 28% 32%, #a59cff 0%, #261447 45%, #120620 78%, #000 100%)',
    'radial-gradient(circle at 50% 35%, #fff 0%, #7cffac 35%, #1bf9fb 55%, #ff00fa 85%, #0d0221 100%)',
  ];
  const indice = Math.abs(id) % paleta.length;
  return paleta[indice];
}

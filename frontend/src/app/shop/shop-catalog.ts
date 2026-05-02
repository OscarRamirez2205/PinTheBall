import type { ShopSkin } from './shop-skin.model';

/** Catálogo demo (10 skins). Las imágenes son gradientes hasta que tengas assets. */
export const SHOP_CATALOG: readonly ShopSkin[] = [
  {
    id: 'classic',
    name: 'Clásica',
    price: 0,
    preview:
      'radial-gradient(circle at 32% 28%, #ffffff 0%, #e8e8e8 18%, #ffea1c 42%, #ff00fa 78%, #0d0221 100%)',
  },
  {
    id: 'neon-pink',
    name: 'Neón rosa',
    price: 320,
    preview:
      'radial-gradient(circle at 30% 30%, #ffb8f9 0%, #ff00fa 45%, #5c0d4a 72%, #0d0221 100%)',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber cian',
    price: 400,
    preview:
      'radial-gradient(circle at 35% 25%, #bfffff 0%, #1bf9fb 40%, #087a82 70%, #0d0221 100%)',
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    price: 480,
    preview:
      'radial-gradient(circle at 40% 35%, #fff6a8 0%, #ff6c11 38%, #ff00fa 72%, #261447 100%)',
  },
  {
    id: 'deep-space',
    name: 'Espacio profundo',
    price: 520,
    preview:
      'radial-gradient(circle at 28% 32%, #a59cff 0%, #261447 45%, #120620 78%, #000 100%)',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    price: 580,
    preview:
      'radial-gradient(circle at 50% 35%, #fff 0%, #7cffac 35%, #1bf9fb 55%, #ff00fa 85%, #0d0221 100%)',
  },
  {
    id: 'gold-rush',
    name: 'Fiebre oro',
    price: 640,
    preview:
      'radial-gradient(circle at 32% 30%, #fff8dc 0%, #ffea1c 45%, #b8860b 75%, #1a0f02 100%)',
  },
  {
    id: 'blood-moon',
    name: 'Luna roja',
    price: 710,
    preview:
      'radial-gradient(circle at 40% 40%, #ffc4c4 0%, #ff3864 42%, #4a0618 78%, #0d0221 100%)',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    price: 760,
    preview:
      'radial-gradient(circle at 35% 35%, #c8ffc8 0%, #15b2b4 40%, #06300a 72%, #020804 100%)',
  },
  {
    id: 'void',
    name: 'El vacío',
    price: 900,
    preview:
      'radial-gradient(circle at 50% 50%, #2a1848 0%, #0d0221 55%, #000000 92%, #000 100%)',
  },
] as const;

/** Skin destacada en «Oferta del día» (sustituir por lógica de API si aplica). */
export const DAILY_DEAL_SKIN_ID = 'plasma';

export function discountedDailyPrice(skin: ShopSkin): number {
  return Math.max(99, Math.floor(skin.price * 0.55));
}

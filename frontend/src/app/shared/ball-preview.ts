import { ballPreviewUrl } from './ball-textures.catalog';

/** URL de la imagen Preview1 para una bola (sustituye los gradientes demo). */
export function ballPreviewImage(textureSlug: string | null | undefined): string {
  return ballPreviewUrl(textureSlug);
}

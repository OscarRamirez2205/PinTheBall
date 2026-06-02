import { ballPreviewUrl } from './ball-textures.catalog';

export function ballPreviewImage(textureSlug: string | null | undefined): string {
  return ballPreviewUrl(textureSlug);
}

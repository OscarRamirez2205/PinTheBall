export interface BallTextureMaps {
  albedo: string;
  normal: string;
  metallic: string;
  roughness: string;
  ambientOcclusion: string;
}

export interface BallCatalogEntry {
  slug: string;
  name: string;
  subname: string;
  price: number;
  dealPrice: number;
  previewUrl: string;
  maps: BallTextureMaps;
}

const STATIC_TEXTURES_ROOT = '/resources/balls-textures';

function mapsFor(root: string, slug: string, assetPrefix: string): BallTextureMaps {
  const base = `${root}/${slug}/2K/${assetPrefix}`;
  return {
    albedo: `${base}_BaseColor.jpg`,
    normal: `${base}_Normal.png`,
    metallic: `${base}_Metallic.jpg`,
    roughness: `${base}_Roughness.jpg`,
    ambientOcclusion: `${base}_AmbientOcclusion.jpg`,
  };
}

function entry(
  slug: string,
  assetPrefix: string,
  name: string,
  subname: string,
  price: number,
  dealPrice: number,
  root = STATIC_TEXTURES_ROOT,
): BallCatalogEntry {
  return {
    slug,
    name,
    subname,
    price,
    dealPrice,
    previewUrl: `${root}/${slug}/${assetPrefix}_Preview1.png`,
    maps: mapsFor(root, slug, assetPrefix),
  };
}

/** Bolas con texturas Poliigon en public/resources/balls-textures */
export const BALL_TEXTURE_CATALOG: readonly BallCatalogEntry[] = [
  entry('brickwallreclaimed', 'Poliigon_BrickWallReclaimed_8320', 'Brick Ball', 'Reclaimed Wall', 280, 110),
  entry('grasspatchyground', 'Poliigon_GrassPatchyGround_4585', 'Grass Ball', 'Patchy Ground', 220, 90),
  entry('metalgoldpaint', 'Poliigon_MetalGoldPaint_7253', 'Gold Ball', 'Painted Metal', 450, 180),
  entry('metalsteelbrushed', 'Poliigon_MetalSteelBrushed_7174', 'Steel Ball', 'Brushed Metal', 0, 0),
  entry('rattanweave', 'Poliigon_RattanWeave_6945', 'Rattan Ball', 'Woven', 320, 130),
  entry('stonequartzite', 'Poliigon_StoneQuartzite_8060', 'Stone Ball', 'Quartzite', 360, 140),
  entry('woodvenneroak', 'Poliigon_WoodVeneerOak_7760', 'Oak Ball', 'Wood Veneer', 300, 120),
] as const;

/** Bola clásica gratuita (Steel Ball). */
export const CLASSIC_BALL_TEXTURE_SLUG = 'metalsteelbrushed';

export const DEFAULT_BALL_TEXTURE_SLUG = CLASSIC_BALL_TEXTURE_SLUG;

const bySlug = new Map(BALL_TEXTURE_CATALOG.map((e) => [e.slug, e]));
const uploadedBySlug = new Map<string, BallCatalogEntry>();

export interface ApiBallTextureRow {
  texture_slug: string | null;
  texture_asset_prefix?: string | null;
  name?: string | null;
  subname?: string | null;
  price?: number | null;
  deal_price?: number | null;
}

export function registerUploadedBallTextures(rows: readonly ApiBallTextureRow[]): void {
  for (const row of rows) {
    if (!row.texture_slug || !row.texture_asset_prefix || bySlug.has(row.texture_slug)) {
      continue;
    }

    uploadedBySlug.set(
      row.texture_slug,
      entry(
        row.texture_slug,
        row.texture_asset_prefix,
        row.name ?? row.texture_slug,
        row.subname ?? '',
        row.price ?? 0,
        row.deal_price ?? 0,
        STATIC_TEXTURES_ROOT,
      ),
    );
  }
}

export function getBallCatalogEntry(slug: string | null | undefined): BallCatalogEntry | undefined {
  if (!slug) {
    return undefined;
  }
  return bySlug.get(slug) ?? uploadedBySlug.get(slug);
}

export function ballPreviewUrl(textureSlug: string | null | undefined): string {
  return getBallCatalogEntry(textureSlug)?.previewUrl ?? getBallCatalogEntry(DEFAULT_BALL_TEXTURE_SLUG)!.previewUrl;
}

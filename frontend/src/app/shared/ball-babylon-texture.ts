import * as BABYLON from '@babylonjs/core';
import {
  DEFAULT_BALL_TEXTURE_SLUG,
  getBallCatalogEntry,
  type BallTextureMaps,
} from './ball-textures.catalog';

const materialCache = new Map<string, BABYLON.PBRMaterial>();

function loadTexture(url: string, scene: BABYLON.Scene): Promise<BABYLON.Texture> {
  return new Promise((resolve, reject) => {
    const texture = new BABYLON.Texture(
      url,
      scene,
      false,
      true,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => resolve(texture),
      (message) => reject(new Error(message ?? `No se pudo cargar ${url}`)),
    );
  });
}

async function buildPbrMaterial(
  slug: string,
  maps: BallTextureMaps,
  scene: BABYLON.Scene,
): Promise<BABYLON.PBRMaterial> {
  const material = new BABYLON.PBRMaterial(`ball-pbr-${slug}`, scene);
  const [albedo, normal, metallic, roughness, ao] = await Promise.all([
    loadTexture(maps.albedo, scene),
    loadTexture(maps.normal, scene),
    loadTexture(maps.metallic, scene),
    loadTexture(maps.roughness, scene),
    loadTexture(maps.ambientOcclusion, scene),
  ]);

  material.albedoTexture = albedo;
  material.bumpTexture = normal;
  material.metallicTexture = metallic;
  material.microSurfaceTexture = roughness;
  material.ambientTexture = ao;
  material.useRoughnessFromMetallicTextureAlpha = false;
  material.useRoughnessFromMetallicTextureGreen = false;
  material.metallic = 1;
  material.roughness = 1;
  material.environmentIntensity = 0.85;

  return material;
}

export async function getBallPbrMaterial(
  textureSlug: string | null | undefined,
  scene: BABYLON.Scene,
): Promise<BABYLON.PBRMaterial> {
  const slug = textureSlug ?? DEFAULT_BALL_TEXTURE_SLUG;
  const cached = materialCache.get(slug);
  if (cached) {
    return cached;
  }

  const entry = getBallCatalogEntry(slug) ?? getBallCatalogEntry(DEFAULT_BALL_TEXTURE_SLUG)!;
  const material = await buildPbrMaterial(entry.slug, entry.maps, scene);
  materialCache.set(entry.slug, material);
  return material;
}

export function applyBallMaterialToMesh(mesh: BABYLON.AbstractMesh, material: BABYLON.PBRMaterial): void {
  mesh.material = material;
  for (const child of mesh.getChildMeshes(false)) {
    child.material = material;
  }
}

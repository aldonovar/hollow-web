import {
  PortableProjectBundleError,
  type PortableProjectAudioAsset,
} from './portableProjectBundleService.ts';

export type PortableProjectAudioCacheWriter = (
  blob: Blob,
  verifiedBytes: ArrayBuffer,
) => Promise<string>;

interface VerifiedPortableAudioAsset {
  sourceId: string;
  asset: PortableProjectAudioAsset;
}

export async function computePortableAudioSourceId(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies every content-addressed source before performing the first cache
 * write. This prevents a partially trusted archive from hydrating the DAW and
 * also keeps a failed source from leaving earlier bundle entries half-imported.
 */
export async function validateAndCachePortableProjectAudioAssets(
  audioAssets: ReadonlyMap<string, PortableProjectAudioAsset>,
  cacheWriter: PortableProjectAudioCacheWriter,
): Promise<number> {
  const verified: VerifiedPortableAudioAsset[] = [];
  for (const [sourceId, asset] of audioAssets.entries()) {
    const bytes = await asset.blob.arrayBuffer();
    const computedSourceId = await computePortableAudioSourceId(bytes);
    if (computedSourceId !== sourceId) {
      throw new PortableProjectBundleError(
        'INVALID_ASSET',
        `La fuente ${sourceId} no coincide con el contenido incluido en el proyecto.`,
      );
    }
    verified.push({ sourceId, asset });
  }

  for (const entry of verified) {
    // Re-read one verified Blob at a time so a large portable project does not
    // retain an ArrayBuffer copy of every source simultaneously on mobile/web.
    const verifiedBytes = await entry.asset.blob.arrayBuffer();
    const cachedSourceId = await cacheWriter(entry.asset.blob, verifiedBytes);
    if (cachedSourceId !== entry.sourceId) {
      throw new PortableProjectBundleError(
        'INVALID_ASSET',
        `La caché rechazó la identidad de la fuente ${entry.sourceId}.`,
      );
    }
  }

  return verified.length;
}

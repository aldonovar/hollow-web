import { localAudioCache } from './localAudioCache';
import { cloudStorageService } from './cloudStorageService';
import { projectOsService } from '../projectOsService';
import type { AssetRef } from '@hollowbits/core';

export interface ProjectAudioAsset {
  blob: Blob;
  fileName?: string;
}

/**
 * Audio Resource Manager
 * Proxy between the Engine and the storage layers (Local/OPFS + Cloud/Supabase).
 * Cloud commits preserve the original, browser-decodable bytes. Lossless
 * transcoding can be added later, but must never be simulated by relabelling a
 * WAV/MP3 blob as FLAC.
 */
class AudioResourceManager {
  /**
   * Retrieves an audio buffer. Checks local OPFS/IDB cache first.
   * If not found, downloads from cloud and caches it locally.
   */
  public async getAudioBuffer(projectId: string, fileId: string, assetPath?: string): Promise<Blob> {
    // 1. Check local cache (fast)
    const localBlob = await localAudioCache.getAudioLocally(fileId);
    if (localBlob) {
      return localBlob;
    }

    // 2. Not in cache, download from cloud (slow)
    console.log(`[Storage] Cache miss for ${fileId}, downloading from cloud...`);
    const cloudBlob = await cloudStorageService.downloadAudioFromCloud(projectId, fileId, assetPath);

    // 3. Save asymmetrically to local cache for future
    // We don't await this so we can return the blob to the engine ASAP
    localAudioCache.saveAudioLocally(fileId, cloudBlob).catch(err => {
      console.error('[Storage] Failed to cache downloaded audio:', err);
    });

    return cloudBlob;
  }

  /**
   * Commits project audio during an explicit cloud save. The promise resolves
   * only after every object is available remotely, so metadata is never
   * reported as saved while its sources are still pending.
   */
  public async commitProjectAudio(
    projectId: string,
    workspaceId: string | undefined,
    assets: Map<string, ProjectAudioAsset>,
  ): Promise<AssetRef[]> {
    const entries = Array.from(assets.entries());
    const committed: Array<AssetRef | undefined> = new Array(entries.length);
    const failures: unknown[] = [];
    let nextIndex = 0;

    const commitOne = async (index: number): Promise<void> => {
      const entry = entries[index];
      if (!entry) return;
      const [fileId, asset] = entry;
      try {
        const cloudPath = await cloudStorageService.uploadAudioToCloud(
          projectId,
          fileId,
          asset.blob,
          asset.fileName,
        );
        const assetRecord = await projectOsService.registerAsset({
          bucket: 'project-audio',
          path: cloudPath,
          projectId,
          workspaceId,
          hash: fileId,
          sizeBytes: asset.blob.size,
          format: cloudPath.split('.').pop() || 'bin',
          metadata: {
            source: 'audioResourceManager.commitProjectAudio',
            fileId,
            originalName: asset.fileName,
          },
        });

        committed[index] = {
          id: assetRecord.id,
          bucket: assetRecord.bucket,
          path: assetRecord.path,
          ownerId: assetRecord.owner_id,
          workspaceId: assetRecord.workspace_id || undefined,
          projectId: assetRecord.project_id || undefined,
          hash: assetRecord.hash || fileId,
          sizeBytes: assetRecord.size_bytes,
          durationSeconds: assetRecord.duration_seconds || undefined,
          format: assetRecord.format || undefined,
          sampleRate: assetRecord.sample_rate || undefined,
          licenseState: assetRecord.license_state as AssetRef['licenseState'],
          createdAt: assetRecord.created_at,
        } satisfies AssetRef;
      } catch (err) {
        console.error(`[Storage] Failed to sync ${fileId} to cloud`, err);
        failures.push(err);
      }
    };

    const workerCount = Math.min(2, entries.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
      while (nextIndex < entries.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        await commitOne(currentIndex);
      }
    }));

    if (failures.length > 0) {
      throw new Error(`No se pudieron sincronizar ${failures.length} de ${entries.length} archivos de audio.`);
    }

    const result = committed.filter((ref): ref is AssetRef => Boolean(ref));
    console.info(`[Storage] Cloud audio sync complete: ${result.length} original assets.`);
    return result;
  }
}

export const audioResourceManager = new AudioResourceManager();

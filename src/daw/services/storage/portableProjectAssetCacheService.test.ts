import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computePortableAudioSourceId,
  validateAndCachePortableProjectAudioAssets,
} from './portableProjectAssetCacheService.ts';
import { PortableProjectBundleError } from './portableProjectBundleService.ts';

async function sourceAsset(text: string, type = 'audio/wav') {
  const blob = new Blob([text], { type });
  const bytes = await blob.arrayBuffer();
  return {
    sourceId: await computePortableAudioSourceId(bytes),
    asset: { blob, fileName: 'take.wav' },
    bytes,
  };
}

test('validates all hashes before caching and preserves the verified bytes', async () => {
  const first = await sourceAsset('first');
  const second = await sourceAsset('second', 'audio/mpeg');
  const writes: Array<{ sourceId: string; bytes: Uint8Array }> = [];

  const count = await validateAndCachePortableProjectAudioAssets(new Map([
    [first.sourceId, first.asset],
    [second.sourceId, second.asset],
  ]), async (_blob, bytes) => {
    const sourceId = await computePortableAudioSourceId(bytes);
    writes.push({ sourceId, bytes: new Uint8Array(bytes) });
    return sourceId;
  });

  assert.equal(count, 2);
  assert.deepEqual(writes.map((write) => write.sourceId), [first.sourceId, second.sourceId]);
  assert.deepEqual(writes[0].bytes, new Uint8Array(first.bytes));
  assert.deepEqual(writes[1].bytes, new Uint8Array(second.bytes));
});

test('does not cache any entry when one sourceId is not its SHA-1 content address', async () => {
  const valid = await sourceAsset('valid');
  const invalid = await sourceAsset('tampered');
  let cacheWrites = 0;

  await assert.rejects(
    validateAndCachePortableProjectAudioAssets(new Map([
      [valid.sourceId, valid.asset],
      ['0000000000000000000000000000000000000000', invalid.asset],
    ]), async () => {
      cacheWrites += 1;
      return valid.sourceId;
    }),
    (error) => error instanceof PortableProjectBundleError && error.code === 'INVALID_ASSET',
  );
  assert.equal(cacheWrites, 0);
});

test('rejects a cache writer that reports a different content identity', async () => {
  const valid = await sourceAsset('valid');

  await assert.rejects(
    validateAndCachePortableProjectAudioAssets(
      new Map([[valid.sourceId, valid.asset]]),
      async () => 'different-source',
    ),
    (error) => error instanceof PortableProjectBundleError && error.code === 'INVALID_ASSET',
  );
});

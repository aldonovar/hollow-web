import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import type { ProjectData } from '../../types.ts';
import {
  createPortableProjectBundle,
  PortableProjectBundleError,
  readPortableProjectBundle,
  type PortableProjectAudioAsset,
  type PortableProjectBundleErrorCode,
} from './portableProjectBundleService.ts';

function projectFixture(sourceIds: string[] = ['source-a']): ProjectData {
  return {
    version: '1.0.0',
    name: 'Portable session',
    tracks: sourceIds.length === 0 ? [] : [{
      id: 'track-1',
      name: 'Audio',
      clips: sourceIds.map((sourceId, index) => ({
        id: `clip-${index + 1}`,
        name: index === 0 ? 'original.mp3' : `take-${index + 1}.wav`,
        sourceId,
      })),
      sessionClips: [],
      devices: [],
    }],
    transport: { bpm: 120 },
    audioSettings: { sampleRate: 48_000 },
    createdAt: 1,
    lastModified: 2,
  } as unknown as ProjectData;
}

function asset(bytes = new Uint8Array([0x49, 0x44, 0x33, 0x00, 0xff])): PortableProjectAudioAsset {
  return {
    blob: new Blob([bytes], { type: 'audio/mpeg' }),
    fileName: 'original.mp3',
  };
}

async function customZip(
  projectData: ProjectData,
  entries: ReadonlyArray<readonly [string, Uint8Array]>,
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(projectData), { createFolders: false });
  entries.forEach(([path, bytes]) => zip.file(path, bytes, { createFolders: false }));
  return zip.generateAsync({ type: 'uint8array' });
}

function hasCode(code: PortableProjectBundleErrorCode): (error: unknown) => boolean {
  return (error) => error instanceof PortableProjectBundleError && error.code === code;
}

test('round-trips ProjectData and exact original audio bytes in the documented ZIP paths', async () => {
  const projectData = projectFixture();
  const originalBytes = new Uint8Array([0x49, 0x44, 0x33, 0x00, 0xff]);
  const bundle = await createPortableProjectBundle(
    projectData,
    new Map([['source-a', asset(originalBytes)]]),
  );

  const zip = await JSZip.loadAsync(new Uint8Array(await bundle.arrayBuffer()));
  assert.deepEqual(Object.keys(zip.files).sort(), ['audio/source-a.mp3', 'manifest.json']);
  assert.deepEqual(JSON.parse(await zip.file('manifest.json')!.async('text')), projectData);

  const restored = await readPortableProjectBundle(bundle);
  assert.equal(restored.format, 'portable-zip');
  assert.deepEqual(restored.projectData, projectData);
  assert.equal(restored.audioAssets.get('source-a')?.fileName, 'original.mp3');
  assert.equal(restored.audioAssets.get('source-a')?.blob.type, 'audio/mpeg');
  assert.deepEqual(
    new Uint8Array(await restored.audioAssets.get('source-a')!.blob.arrayBuffer()),
    originalBytes,
  );
});

test('reads legacy .esp JSON without pretending that it embeds audio', async () => {
  const projectData = projectFixture();
  const restored = await readPortableProjectBundle(`\uFEFF  ${JSON.stringify(projectData)}`);

  assert.equal(restored.format, 'legacy-json');
  assert.deepEqual(restored.projectData, projectData);
  assert.equal(restored.audioAssets.size, 0);
});

test('rejects missing, extra and duplicate sources before generating a bundle', async () => {
  const projectData = projectFixture();

  await assert.rejects(createPortableProjectBundle(projectData, new Map()), hasCode('MISSING_ASSET'));
  await assert.rejects(createPortableProjectBundle(
    projectData,
    new Map([
      ['source-a', asset()],
      ['source-extra', asset()],
    ]),
  ), hasCode('UNEXPECTED_ASSET'));
  await assert.rejects(createPortableProjectBundle(projectData, [
    ['source-a', asset()],
    ['source-a', asset()],
  ]), hasCode('DUPLICATE_SOURCE'));
});

test('rejects unsafe source ids and unknown codecs instead of inventing a file format', async () => {
  await assert.rejects(createPortableProjectBundle(
    projectFixture(['../source-a']),
    new Map([['../source-a', asset()]]),
  ), hasCode('INVALID_SOURCE_ID'));

  await assert.rejects(createPortableProjectBundle(
    projectFixture(),
    new Map([['source-a', {
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'application/octet-stream' }),
      fileName: 'unknown',
    }]]),
  ), hasCode('UNSUPPORTED_FORMAT'));
});

test('rejects traversal and any undeclared path before JSZip can normalize it', async () => {
  const traversal = await customZip(projectFixture([]), [
    ['../escape.wav', new Uint8Array([1])],
  ]);
  const undeclared = await customZip(projectFixture([]), [
    ['cover.png', new Uint8Array([1])],
  ]);

  await assert.rejects(readPortableProjectBundle(traversal), hasCode('INVALID_PATH'));
  await assert.rejects(readPortableProjectBundle(undeclared), hasCode('INVALID_PATH'));
});

test('rejects two archive entries that claim the same sourceId', async () => {
  const bundle = await customZip(projectFixture(), [
    ['audio/source-a.wav', new Uint8Array([1])],
    ['audio/source-a.mp3', new Uint8Array([2])],
  ]);

  await assert.rejects(readPortableProjectBundle(bundle), hasCode('DUPLICATE_SOURCE'));
});

test('enforces declared per-file and aggregate size limits during write and read', async () => {
  const projectData = projectFixture();
  await assert.rejects(createPortableProjectBundle(
    projectData,
    new Map([['source-a', asset(new Uint8Array([1, 2, 3, 4]))]]),
    { maxAudioFileBytes: 3 },
  ), hasCode('AUDIO_TOO_LARGE'));

  const bundle = await customZip(projectData, [
    ['audio/source-a.mp3', new Uint8Array([1, 2, 3, 4])],
  ]);
  await assert.rejects(
    readPortableProjectBundle(bundle, { maxAudioFileBytes: 3 }),
    hasCode('AUDIO_TOO_LARGE'),
  );

  const twoSourceProject = projectFixture(['source-a', 'source-b']);
  await assert.rejects(createPortableProjectBundle(
    twoSourceProject,
    new Map([
      ['source-a', asset(new Uint8Array([1, 2]))],
      ['source-b', asset(new Uint8Array([3, 4]))],
    ]),
    { maxAudioFileBytes: 2, maxTotalAudioBytes: 3 },
  ), hasCode('AUDIO_TOO_LARGE'));

  const aggregateBundle = await customZip(twoSourceProject, [
    ['audio/source-a.mp3', new Uint8Array([1, 2])],
    ['audio/source-b.wav', new Uint8Array([3, 4])],
  ]);
  await assert.rejects(readPortableProjectBundle(aggregateBundle, {
    maxAudioFileBytes: 2,
    maxTotalAudioBytes: 3,
  }), hasCode('AUDIO_TOO_LARGE'));
});

test('rejects a ZIP whose manifest omits or does not reference its embedded source', async () => {
  const missing = await customZip(projectFixture(), []);
  const extra = await customZip(projectFixture([]), [
    ['audio/source-a.wav', new Uint8Array([1])],
  ]);

  await assert.rejects(readPortableProjectBundle(missing), hasCode('MISSING_ASSET'));
  await assert.rejects(readPortableProjectBundle(extra), hasCode('UNEXPECTED_ASSET'));
});

test('exposes stable typed error codes for callers without leaking raw ZIP errors', async () => {
  await assert.rejects(
    readPortableProjectBundle(new Uint8Array([1, 2, 3])),
    hasCode('INVALID_ARCHIVE'),
  );
});

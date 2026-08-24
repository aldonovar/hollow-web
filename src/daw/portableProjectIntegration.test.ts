import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const appSource = readSource('./App.tsx');
const platformSource = readSource('./services/platformService.ts');

test('disk import parses binary or legacy projects and validates all audio before hydrate', () => {
  assert.match(appSource, /platformService\.openProjectBlob\(\)/);
  assert.match(appSource, /readPortableProjectBundle\(blob\)/);
  assert.match(appSource, /validateAndCachePortableProjectAudioAssets\([\s\S]*?await hydrateProjectData/);
});

test('explicit downloads and cloud-failure backups both use the portable audio bundle', () => {
  assert.match(appSource, /createPortableProjectFile\(integrityResult\.project\)/);
  assert.match(appSource, /createPortableProjectFile\(backup\.project\)/);
  assert.match(appSource, /platformService\.saveProjectBlob\(backupBlob, projectName\)/);
  assert.match(appSource, /fuentes de audio originales incluidas/);
});

test('platform project APIs keep Blob bytes and retain legacy text adapters', () => {
  assert.match(platformSource, /saveProjectBlob\(blob: Blob/);
  assert.match(platformSource, /openProjectBlob\(\)/);
  assert.match(platformSource, /Legacy text API retained/);
  assert.match(platformSource, /application\/zip/);
});

test('project hydration decodes sequentially and reuses buffers by sourceId', () => {
  const start = appSource.indexOf('const hydratedAudioBuffers');
  const end = appSource.indexOf('replaceTracks(rehydratedTracks', start);
  assert.ok(start > 0);
  assert.ok(end > start);
  const hydrationBlock = appSource.slice(start, end);
  assert.match(hydrationBlock, /for \(const track of projectData\.tracks\)/);
  assert.match(hydrationBlock, /for \(const clip of track\.clips\)/);
  assert.match(hydrationBlock, /hydratedAudioBuffers\.has\(clip\.sourceId\)/);
  assert.doesNotMatch(hydrationBlock, /Promise\.all/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Track } from '../../types.ts';
import {
  collectProjectAudioSourceRefs,
  getProjectAudioAssetRef,
  hasDeclaredProjectAudioAssetRefs,
  isProjectAudioAssetRef,
  loadProjectAudioAssets,
  mergeProjectAudioAssetRefs,
  resolveProjectAudioBlob,
} from './projectAudioAssetService.ts';

const PROJECT_ID = 'project-123';
const WORKSPACE_ID = 'workspace-456';

function projectAudioRef(overrides: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    bucket: 'project-audio',
    path: `owner-1/${PROJECT_ID}/source-a.wav`,
    ownerId: 'owner-1',
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    hash: 'source-a',
    sizeBytes: 5,
    format: 'wav',
    ...overrides,
  };
}

function projectTrack(): Track {
  return {
    id: 'track-1',
    name: 'Vocals',
    type: 'audio' as Track['type'],
    color: '#fff',
    volume: 0,
    pan: 0,
    reverb: 0,
    transpose: 0,
    monitor: 'auto',
    isMuted: false,
    isSoloed: false,
    isArmed: false,
    clips: [{
      id: 'clip-1',
      name: 'lead.wav',
      color: '#fff',
      notes: [],
      start: 1,
      length: 1,
      offset: 0,
      fadeIn: 0,
      fadeOut: 0,
      gain: 1,
      playbackRate: 1,
      sourceId: 'source-a',
    }],
    sessionClips: [],
    devices: [],
  } as Track;
}

test('deduplicates source references while preserving the original filename', () => {
  const track = projectTrack();
  track.sessionClips = [{ id: 'slot-1', clip: track.clips[0], isPlaying: false, isQueued: false }];
  assert.deepEqual(collectProjectAudioSourceRefs([track]), [{
    sourceId: 'source-a',
    fileName: 'lead.wav',
  }]);
});

test('refuses a cloud commit when metadata references a missing local source', async () => {
  await assert.rejects(
    loadProjectAudioAssets([projectTrack()], async () => null),
    /Faltan 1 fuentes de audio locales/,
  );
});

test('returns exact original bytes for explicit cloud upload', async () => {
  const blob = new Blob(['audio'], { type: 'audio/wav' });
  const assets = await loadProjectAudioAssets([projectTrack()], async () => blob);
  assert.equal(assets.get('source-a')?.blob, blob);
  assert.equal(assets.get('source-a')?.fileName, 'lead.wav');
});

test('accepts only a ref whose bucket, hash, project, workspace and path agree', () => {
  const valid = projectAudioRef();
  assert.equal(isProjectAudioAssetRef(valid, 'source-a', PROJECT_ID, WORKSPACE_ID), true);
  assert.equal(isProjectAudioAssetRef(valid, 'source-b', PROJECT_ID, WORKSPACE_ID), false);
  assert.equal(isProjectAudioAssetRef(valid, 'source-a', 'project-other', WORKSPACE_ID), false);
  assert.equal(isProjectAudioAssetRef(valid, 'source-a', PROJECT_ID, 'workspace-other'), false);
  assert.equal(isProjectAudioAssetRef({ ...valid, bucket: 'exports' }, 'source-a', PROJECT_ID), false);
});

test('rejects traversal, project-prefix and source-prefix path substitutions', () => {
  const invalidPaths = [
    `owner-1/${PROJECT_ID}/../source-a.wav`,
    `owner-1/${PROJECT_ID}-other/source-a.wav`,
    `owner-1/${PROJECT_ID}/source-a-copy.wav`,
    `owner-1\\${PROJECT_ID}\\source-a.wav`,
    `/owner-1/${PROJECT_ID}/source-a.wav`,
    `owner-1/${PROJECT_ID}/source-a.wav/extra`,
    `owner-1/${PROJECT_ID}/source-a.exe`,
  ];

  invalidPaths.forEach((path) => {
    assert.equal(
      isProjectAudioAssetRef(projectAudioRef({ path }), 'source-a', PROJECT_ID),
      false,
      path,
    );
  });
});

test('finds the newest valid ref and ignores malformed manifest entries', () => {
  const oldRef = projectAudioRef({ id: 'asset-old' });
  const newestRef = projectAudioRef({ id: 'asset-new', path: `${PROJECT_ID}/source-a.mp3` });
  const refs = [
    oldRef,
    projectAudioRef({ id: 'wrong-hash', hash: 'source-b' }),
    projectAudioRef({ id: 'unsafe', path: `${PROJECT_ID}/../source-a.wav` }),
    newestRef,
  ];

  assert.equal(
    getProjectAudioAssetRef(refs, 'source-a', PROJECT_ID, WORKSPACE_ID),
    newestRef,
  );
  assert.equal(getProjectAudioAssetRef(refs, 'missing-source', PROJECT_ID), undefined);
  assert.equal(hasDeclaredProjectAudioAssetRefs(refs), true);
  assert.equal(hasDeclaredProjectAudioAssetRefs([{ ...oldRef, bucket: 'project-exports' }]), false);
});

test('merges valid refs by project and source, with uploaded entries taking precedence', () => {
  const existing = projectAudioRef({ id: 'asset-old' });
  const replacement = projectAudioRef({ id: 'asset-new', path: `${PROJECT_ID}/source-a.mp3` });
  const second = projectAudioRef({
    id: 'asset-second',
    path: `${PROJECT_ID}/source-b.ogg`,
    hash: 'source-b',
  });
  const unrelated = {
    id: 'export-1',
    bucket: 'exports',
    path: 'owner-1/export-1.wav',
    ownerId: 'owner-1',
  };

  assert.deepEqual(
    mergeProjectAudioAssetRefs(
      [unrelated, existing, { bucket: 'project-audio', path: '../invalid' }],
      [replacement, second],
    ),
    [unrelated, replacement, second],
  );
});

test('refuses an invalid newly-uploaded ref instead of publishing a broken manifest', () => {
  assert.throws(
    () => mergeProjectAudioAssetRefs([], [projectAudioRef({ path: `${PROJECT_ID}/other.wav` })]),
    /Invalid project audio asset reference/,
  );
});

test('never downloads through a malformed modern project-audio ref', async () => {
  let downloadCount = 0;
  await assert.rejects(
    resolveProjectAudioBlob({
      assetRefs: [projectAudioRef({ projectId: 'project-other' })],
      sourceId: 'source-a',
      projectId: PROJECT_ID,
      workspaceId: WORKSPACE_ID,
      getLocalBlob: async () => null,
      downloadCloudBlob: async () => {
        downloadCount += 1;
        return new Blob(['wrong']);
      },
      cacheCloudBlob: async () => 'source-a',
    }),
    /referencias cloud incompatibles/,
  );
  assert.equal(downloadCount, 0);
});

test('downloads an exact ref and rejects bytes whose cached hash differs', async () => {
  const valid = projectAudioRef();
  let requestedPath = '';
  const blob = new Blob(['audio'], { type: 'audio/wav' });
  const resolved = await resolveProjectAudioBlob({
    assetRefs: [valid],
    sourceId: 'source-a',
    projectId: PROJECT_ID,
    workspaceId: WORKSPACE_ID,
    getLocalBlob: async () => null,
    downloadCloudBlob: async (_project, _source, path) => {
      requestedPath = path || '';
      return blob;
    },
    cacheCloudBlob: async () => 'source-a',
  });
  assert.equal(resolved, blob);
  assert.equal(requestedPath, valid.path);

  await assert.rejects(
    resolveProjectAudioBlob({
      assetRefs: [valid],
      sourceId: 'source-a',
      projectId: PROJECT_ID,
      workspaceId: WORKSPACE_ID,
      getLocalBlob: async () => null,
      downloadCloudBlob: async () => blob,
      cacheCloudBlob: async () => 'different-hash',
    }),
    /huella guardada/,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAudioAssetFormat } from './audioAssetFormat.ts';

test('preserves common browser audio formats instead of relabelling them as FLAC', () => {
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['mp3'], { type: 'audio/mpeg' }), 'track.mp3'),
    { extension: 'mp3', contentType: 'audio/mpeg' },
  );
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['recording'], { type: 'audio/webm' }), 'take'),
    { extension: 'webm', contentType: 'audio/webm' },
  );
});

test('uses a trusted filename extension when the desktop bridge supplies an opaque MIME', () => {
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['aiff'], { type: 'application/octet-stream' }), 'keys.AIFF'),
    { extension: 'aiff', contentType: 'audio/aiff' },
  );
});

test('falls back to an opaque object without inventing an audio encoding', () => {
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['unknown'], { type: 'application/octet-stream' }), 'take'),
    { extension: 'bin', contentType: 'application/octet-stream' },
  );
});

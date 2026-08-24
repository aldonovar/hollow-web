import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_CLOUD_AUDIO_OBJECT_BYTES,
  resolveAudioAssetFormat,
  resolveCloudAudioUploadFormat,
} from './audioAssetFormat.ts';

test('preserves common browser audio formats instead of relabelling them as FLAC', () => {
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['mp3'], { type: 'audio/mpeg' }), 'track.mp3'),
    { extension: 'mp3', contentType: 'audio/mpeg' },
  );
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['recording'], { type: 'audio/webm' }), 'take'),
    { extension: 'webm', contentType: 'audio/webm' },
  );
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['opus'], { type: 'audio/opus' }), 'take.opus'),
    { extension: 'opus', contentType: 'audio/ogg' },
  );
  assert.deepEqual(
    resolveAudioAssetFormat(new Blob(['aac'], { type: 'audio/aac' }), 'take.aac'),
    { extension: 'aac', contentType: 'audio/aac' },
  );
});

test('preflights the real bucket size and MIME policy before cloud upload', () => {
  assert.throws(
    () => resolveCloudAudioUploadFormat(
      { size: MAX_CLOUD_AUDIO_OBJECT_BYTES + 1, type: 'audio/wav' } as Blob,
      'large.wav',
    ),
    /100 MiB/,
  );
  assert.throws(
    () => resolveCloudAudioUploadFormat({ size: 8, type: 'audio/aac' } as Blob, 'raw.aac'),
    /todavía no admite/,
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

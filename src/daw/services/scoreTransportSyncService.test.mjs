import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';

const serviceUrl = new URL('./scoreTransportSyncService.ts', import.meta.url);
const bundle = await build({
  entryPoints: [serviceUrl.pathname],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const bundledModule = { exports: {} };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(
  require,
  bundledModule,
  bundledModule.exports,
);
const {
  buildScoreTransportFrame,
  getScoreClipTransportTransform,
  globalTimeline16thToScoreSource16th,
  normalizeScoreNotesToAudibleClipWindow,
  scoreSource16thToGlobalTimeline16th,
  timeline16thToBarTime,
} = bundledModule.exports;

const clockAt = (currentBar, currentBeat = 1, currentSixteenth = 1) => ({
  currentBar,
  currentBeat,
  currentSixteenth,
  isPlaying: false,
  updatedAt: 0,
});

const audioContext = (patch = {}) => ({
  sourceKind: 'audio',
  clipStartBar: 1,
  clipLengthBars: 4,
  clipOffsetBars: 0,
  playbackRate: 1,
  sourceOriginalBpm: 120,
  noteGridBpm: 120,
  projectBpm: 120,
  isWarped: true,
  clipTransposeSemitones: 0,
  trackTransposeSemitones: 0,
  masterTransposeSemitones: 0,
  ...patch,
});

test('score transport preserves notation time signatures outside clip context', () => {
  assert.equal(timeline16thToBarTime(12, [3, 4]), 2);
  assert.equal(timeline16thToBarTime(16, [4, 4]), 2);
});

test('score transport maps clip start, length, offset and playback rate bidirectionally', () => {
  const context = audioContext({
    clipStartBar: 3,
    clipLengthBars: 2,
    clipOffsetBars: 0.5,
    playbackRate: 1.5,
  });

  assert.ok(Math.abs(globalTimeline16thToScoreSource16th(32, context) - 12) < 1e-8);
  assert.ok(Math.abs(globalTimeline16thToScoreSource16th(40, context) - 24) < 1e-8);
  assert.ok(Math.abs(scoreSource16thToGlobalTimeline16th(12, context) - 32) < 1e-8);
  assert.ok(Math.abs(scoreSource16thToGlobalTimeline16th(24, context) - 40) < 1e-8);
  assert.equal(scoreSource16thToGlobalTimeline16th(1_000, context), 64);
});

test('score transport applies transpose to native timing and isolates warped pitch', () => {
  const native = getScoreClipTransportTransform(audioContext({
    isWarped: false,
    clipTransposeSemitones: 7,
    trackTransposeSemitones: 3,
    masterTransposeSemitones: 2,
  }));
  const warped = getScoreClipTransportTransform(audioContext({
    isWarped: true,
    clipTransposeSemitones: 7,
    trackTransposeSemitones: 3,
    masterTransposeSemitones: 2,
  }));

  assert.ok(Math.abs(native.sourceGridRate - 2) < 1e-8);
  assert.ok(Math.abs(native.audiblePitchShiftSemitones - 12) < 1e-8);
  assert.ok(Math.abs(warped.sourceGridRate - 1) < 1e-8);
  assert.ok(Math.abs(warped.audiblePitchShiftSemitones - 12) < 1e-8);
});

test('score transport follows project/source BPM in the transcription grid', () => {
  const context = audioContext({
    projectBpm: 60,
    sourceOriginalBpm: 120,
    noteGridBpm: 60,
    playbackRate: 1,
    isWarped: true,
  });

  assert.ok(Math.abs(getScoreClipTransportTransform(context).sourceGridRate - 0.5) < 1e-8);
  assert.ok(Math.abs(globalTimeline16thToScoreSource16th(8, context) - 4) < 1e-8);
});

test('score transport never activates notes outside the clip or at a half-open end', () => {
  const notes = [{ pitch: 60, start: 8, duration: 4, velocity: 100 }];
  const context = audioContext({ clipStartBar: 3, clipLengthBars: 1, clipOffsetBars: 0.5 });

  const before = buildScoreTransportFrame(notes, clockAt(2), [3, 4], 120, 0, context);
  const atStart = buildScoreTransportFrame(notes, clockAt(3), [3, 4], 120, 0, context);
  const atNoteEnd = buildScoreTransportFrame(notes, clockAt(3, 2, 1), [3, 4], 120, 0, context);
  const after = buildScoreTransportFrame(notes, clockAt(4), [3, 4], 120, 0, context);

  assert.equal(before.globalPlayhead16th, 16);
  assert.deepEqual(before.activeNoteIndexes, []);
  assert.equal(atStart.globalPlayhead16th, 32);
  assert.equal(atStart.playhead16th, 8);
  assert.deepEqual(atStart.activeNoteIndexes, [0]);
  assert.equal(atNoteEnd.playhead16th, 12);
  assert.deepEqual(atNoteEnd.activeNoteIndexes, []);
  assert.equal(after.globalPlayhead16th, 48);
  assert.deepEqual(after.activeNoteIndexes, []);
});

test('score transport drops notes outside a trimmed clip and clips crossings into local time', () => {
  const notes = [
    { pitch: 40, start: 0, duration: 8, velocity: 80 },
    { pitch: 41, start: 6, duration: 4, velocity: 81 },
    { pitch: 42, start: 12, duration: 4, velocity: 82 },
    { pitch: 43, start: 22, duration: 4, velocity: 83 },
    { pitch: 44, start: 24, duration: 2, velocity: 84 },
  ];
  const normalized = normalizeScoreNotesToAudibleClipWindow(notes, audioContext({
    clipLengthBars: 1,
    clipOffsetBars: 0.5,
    playbackRate: 1,
  }));

  assert.deepEqual(normalized, [
    { pitch: 41, start: 0, duration: 2, velocity: 81 },
    { pitch: 42, start: 4, duration: 4, velocity: 82 },
    { pitch: 43, start: 14, duration: 2, velocity: 83 },
  ]);
});

test('score transport translates source notes at fast and slow playback rates', () => {
  const fast = normalizeScoreNotesToAudibleClipWindow([
    { pitch: 60, start: 12, duration: 3, velocity: 90 },
    { pitch: 64, start: 24, duration: 6, velocity: 91 },
    { pitch: 67, start: 57, duration: 9, velocity: 92 },
    { pitch: 72, start: 60, duration: 2, velocity: 93 },
  ], audioContext({
    clipLengthBars: 2,
    clipOffsetBars: 0.5,
    playbackRate: 1.5,
  }));
  const slow = normalizeScoreNotesToAudibleClipWindow([
    { pitch: 55, start: 10, duration: 2, velocity: 88 },
  ], audioContext({
    clipLengthBars: 1,
    clipOffsetBars: 1,
    playbackRate: 0.5,
  }));

  assert.deepEqual(fast, [
    { pitch: 60, start: 0, duration: 2, velocity: 90 },
    { pitch: 64, start: 8, duration: 4, velocity: 91 },
    { pitch: 67, start: 30, duration: 2, velocity: 92 },
  ]);
  assert.deepEqual(slow, [
    { pitch: 55, start: 4, duration: 4, velocity: 88 },
  ]);
});

test('score transport keeps normalized drafts clip-local for transport, seek and commit clamping', () => {
  const context = audioContext({
    noteTimeDomain: 'clip-local',
    clipStartBar: 3,
    clipLengthBars: 1,
    clipOffsetBars: 4,
    playbackRate: 2,
  });
  const normalized = normalizeScoreNotesToAudibleClipWindow([
    { pitch: 60, start: -2, duration: 4, velocity: 90 },
    { pitch: 64, start: 14, duration: 4, velocity: 91 },
    { pitch: 67, start: 16, duration: 2, velocity: 92 },
  ], context);

  assert.deepEqual(normalized, [
    { pitch: 60, start: 0, duration: 2, velocity: 90 },
    { pitch: 64, start: 14, duration: 2, velocity: 91 },
  ]);
  assert.equal(globalTimeline16thToScoreSource16th(32, context), 0);
  assert.equal(globalTimeline16thToScoreSource16th(40, context), 8);
  assert.equal(scoreSource16thToGlobalTimeline16th(8, context), 40);
});

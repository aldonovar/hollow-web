import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./Transport.tsx', import.meta.url), 'utf8');

const actionButton = (action) => {
  const marker = `data-transport-action="${action}"`;
  const markerIndex = source.indexOf(marker);
  assert.ok(markerIndex >= 0, `missing ${action} transport action`);
  const start = source.lastIndexOf('<button', markerIndex);
  const end = source.indexOf('</button>', markerIndex);
  assert.ok(start >= 0, `missing ${action} button start`);
  assert.ok(end > markerIndex, `missing ${action} button end`);
  return source.slice(start, end + '</button>'.length);
};

test('Transport wires rewind, stop, play and pause to named button callbacks', () => {
  for (const [action, callback, label] of [
    ['rewind', 'onSkipStart', 'Volver al inicio'],
    ['stop', 'onStop', 'Detener y volver al inicio'],
    ['play', 'onPlay', 'Reproducir'],
    ['pause', 'onPause', 'Pausar']
  ]) {
    const button = actionButton(action);
    assert.match(button, /type="button"/);
    assert.ok(button.includes(`onClick={${callback}}`));
    assert.ok(button.includes(`aria-label="${label}"`));
  }
});

test('Transport exposes coherent playback, pause and stopped visuals', () => {
  assert.ok(source.includes('const isPlaybackActive = transport.isPlaying;'));
  assert.ok(source.includes('const isPaused = !transport.isPlaying && !transport.isRecording && !engineIsPlaying && hasResumeOffset;'));
  assert.ok(source.includes('const isStopped = !transport.isPlaying && !transport.isRecording && !engineIsPlaying && !hasResumeOffset;'));
  assert.ok(actionButton('play').includes('aria-pressed={isPlaybackActive}'));
  assert.ok(actionButton('pause').includes('aria-pressed={isPaused}'));
  assert.ok(actionButton('stop').includes('aria-pressed={isStopped}'));
});

test('Transport groups controls and keeps visible keyboard focus', () => {
  assert.ok(source.includes('role="group" aria-label="Controles de transporte"'));
  assert.ok(source.includes('focus-visible:ring-2'));
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./PianoScoreWorkspace.tsx', import.meta.url), 'utf8');

test('Score-fi gives every transcription an AbortSignal and latest-request identity', () => {
  assert.match(source, /transcriptionAbortRef\s*=\s*useRef<AbortController \| null>/);
  assert.match(source, /transcriptionRequestIdRef\s*=\s*useRef\(0\)/);
  assert.match(source, /const controller = new AbortController\(\)/);
  assert.match(source, /transcribeAudioBuffer\([\s\S]*controller\.signal\s*\)/);
  assert.match(source, /requestId !== transcriptionRequestIdRef\.current \|\| controller\.signal\.aborted/);
});

test('Score-fi rejects a stale result before it can mutate the active workspace', () => {
  const transcriptionCall = source.indexOf('const result = await pianoTranscriptionService.transcribeAudioBuffer');
  const resultGuard = source.indexOf(
    'if (requestId !== transcriptionRequestIdRef.current || controller.signal.aborted) return;',
    transcriptionCall,
  );
  const resultCommit = source.indexOf('setDraftNotes(clipLocalNotes);', transcriptionCall);

  assert.ok(transcriptionCall >= 0);
  assert.ok(resultGuard > transcriptionCall);
  assert.ok(resultCommit > resultGuard);
});

test('Score-fi aborts on source replacement, close and unmount', () => {
  const abortCalls = source.match(/transcriptionAbortRef\.current\?\.abort\(\)/g)?.length ?? 0;

  assert.ok(abortCalls >= 4);
  assert.match(source, /\}, \[currentWorkspace\?\.id\]\);/);
  assert.match(source, /if \(isOpen\) return;[\s\S]*transcriptionAbortRef\.current\?\.abort\(\)/);
  assert.match(source, /useEffect\(\(\) => \(\) => \{[\s\S]*transcriptionAbortRef\.current\?\.abort\(\)/);
  assert.match(source, /const handleCloseWorkspace = useCallback\([\s\S]*transcriptionAbortRef\.current\?\.abort\(\)/);
});

test('Score-fi exposes explicit cancellation and locks source switching while scanning', () => {
  assert.match(source, /aria-label=\{`Fuente musical de \$\{productName\}`\}/);
  assert.match(source, /disabled=\{isScanning\}/);
  assert.match(source, /aria-label="Cancelar transcripcion de piano"/);
  assert.match(source, /Cancelar analisis/);
  assert.match(source, /Transcripcion cancelada\. Puedes volver a analizar cuando quieras\./);
});

test('Score-fi passes full clip timing and audible transpose into Keys-fi', () => {
  for (const field of [
    'clipStartBar: clip.start',
    'clipLengthBars: clip.length',
    'clipOffsetBars: clip.offset',
    'playbackRate: clip.playbackRate',
    'sourceOriginalBpm',
    'noteGridBpm',
    'projectBpm: transport.bpm',
    'isWarped: clip.isWarped',
    'clipTransposeSemitones: clip.transpose',
    'trackTransposeSemitones: track.transpose',
    'masterTransposeSemitones: transport.masterTranspose',
  ]) {
    assert.ok(source.includes(field), `missing clip mapping: ${field}`);
  }

  assert.match(source, /pitchShiftSemitones=\{transportFrame\.audiblePitchShiftSemitones\}/);
});

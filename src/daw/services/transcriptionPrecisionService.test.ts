import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPolaritySafeMono,
  centsFromMidi,
  findInterpolatedPeak,
  refineEnvelopeBounds,
} from './transcriptionPrecisionService.ts';
import { buildSynthesiaPitchViewport } from './synthesiaLayoutService.ts';
import {
  analyzePolyphonicNotes,
  type WorkerScanPayload,
} from '../workers/note-transcriber.worker.ts';

const SAMPLE_RATE = 16_000;
const BPM = 120;
const SECONDS_PER_16TH = (60 / BPM) / 4;
const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

interface ToneEvent {
  midi: number;
  start: number;
  end: number;
  amplitude?: number;
}

const renderTones = (events: ToneEvent[], durationSeconds: number): Float32Array => {
  const signal = new Float32Array(Math.ceil(durationSeconds * SAMPLE_RATE));
  for (let index = 0; index < signal.length; index++) {
    const time = index / SAMPLE_RATE;
    for (const event of events) {
      if (time < event.start || time >= event.end) continue;
      const attack = Math.min(1, (time - event.start) / 0.012);
      const release = Math.min(1, (event.end - time) / 0.045);
      const envelope = Math.sin(Math.min(attack, release) * Math.PI * 0.5) ** 2;
      const phase = 2 * Math.PI * midiToFrequency(event.midi) * (time - event.start);
      signal[index] += (event.amplitude ?? 0.3) * envelope * (
        Math.sin(phase)
        + (Math.sin(phase * 2) * 0.24)
        + (Math.sin(phase * 3) * 0.09)
      );
    }
  }
  return signal;
};

const analyze = (events: ToneEvent[], durationSeconds = 1.4) => {
  const payload: WorkerScanPayload = {
    channels: [renderTones(events, durationSeconds)],
    sampleRate: SAMPLE_RATE,
    bpm: BPM,
    settings: {
      mode: 'polyphonic',
      sensitivity: 0.78,
      minMidi: 21,
      maxMidi: 108,
      maxPolyphony: 6,
      quantize: false,
      quantizeStep16th: 1,
      minDuration16th: 0.25,
    },
  };
  return analyzePolyphonicNotes(payload);
};

const startSeconds = (note: { start: number }) => note.start * SECONDS_PER_16TH;

test('Falling Notes preserves anti-phase stereo content', () => {
  const left = renderTones([{ midi: 69, start: 0, end: 0.5 }], 0.5);
  const right = Float32Array.from(left, (sample) => -sample);
  const mono = buildPolaritySafeMono([left, right]);
  const peak = mono.reduce((highest, sample) => Math.max(highest, Math.abs(sample)), 0);
  assert.ok(peak > 0.2);
});

test('Falling Notes refines chord onsets in narrow pitch bands', () => {
  const pitches = [60, 64, 67];
  const signal = renderTones(pitches.map((midi) => ({ midi, start: 0.24, end: 0.9 })), 1.1);
  const refined = pitches.map((midi) => refineEnvelopeBounds(
    signal,
    SAMPLE_RATE,
    0.12,
    1.02,
    0.16,
    midiToFrequency(midi),
  ));

  refined.forEach((bounds) => assert.ok(Math.abs(bounds.startSec - 0.24) <= 0.045, JSON.stringify(bounds)));
  const onsets = refined.map((bounds) => bounds.startSec);
  assert.ok(Math.max(...onsets) - Math.min(...onsets) <= 0.02);
});

test('Falling Notes does not jump a quiet note to its louder retrigger', () => {
  const signal = renderTones([
    { midi: 60, start: 0.35, end: 0.48, amplitude: 0.12 },
    { midi: 60, start: 0.5, end: 0.8, amplitude: 0.65 },
  ], 1.1);
  const bounds = refineEnvelopeBounds(
    signal,
    SAMPLE_RATE,
    0.38,
    0.49,
    0.16,
    midiToFrequency(60),
  );

  assert.ok(Math.abs(bounds.startSec - 0.35) <= 0.035, JSON.stringify(bounds));
  assert.ok(bounds.endSec < 0.5, JSON.stringify(bounds));
});

test('Falling Notes reuses narrow-band kernels within its postprocess budget', () => {
  const signal = renderTones([
    { midi: 33, start: 0.1, end: 1.9, amplitude: 0.25 },
  ], 2);
  const startedAt = performance.now();
  for (let index = 0; index < 120; index++) {
    refineEnvelopeBounds(signal, SAMPLE_RATE, 0.8, 1.2, 0.16, midiToFrequency(33));
  }
  assert.ok(performance.now() - startedAt < 600);
});

test('Falling Notes web executes the real worker engine and retains open octave voicings', () => {
  const expectedStart = 0.22;
  const result = analyze([
    { midi: 48, start: expectedStart, end: 0.98, amplitude: 0.24 },
    { midi: 72, start: expectedStart, end: 0.98, amplitude: 0.45 },
  ], 1.35);
  const stableNotes = result.notes.filter((note) => note.confidence >= 0.16);

  const bass = stableNotes.find((note) => note.pitch === 48);
  const upper = stableNotes.find((note) => note.pitch === 72);
  assert.ok(bass, JSON.stringify(result.notes));
  assert.ok(upper, JSON.stringify(result.notes));
  assert.ok(Math.abs(startSeconds(bass) - expectedStart) <= 0.1, JSON.stringify(result.notes));
  assert.ok(Math.abs(startSeconds(upper) - expectedStart) <= 0.1, JSON.stringify(result.notes));
});

test('Falling Notes keeps sub-bin pitch math and an adaptive Synthesia viewport', () => {
  const spectrum = new Float32Array(64);
  spectrum[20] = 4;
  spectrum[21] = 10;
  spectrum[22] = 7;
  const peak = findInterpolatedPeak(spectrum, 21, 2);
  assert.ok(peak.bin > 21 && peak.bin < 21.5);
  assert.ok(Math.abs(centsFromMidi(440, 69)) < 1e-9);

  const viewport = buildSynthesiaPitchViewport([{ pitch: 60 }, { pitch: 64 }, { pitch: 67 }]);
  assert.equal(viewport.maxPitch - viewport.minPitch, 36);
  assert.ok(viewport.minPitch <= 60 && viewport.maxPitch >= 67);

  const clampedViewport = buildSynthesiaPitchViewport([{ pitch: 60 }, { pitch: 110 }]);
  assert.ok(clampedViewport.minPitch <= 60);
  assert.equal(clampedViewport.maxPitch, 108);
  assert.equal(clampedViewport.noteCount, 2);
});

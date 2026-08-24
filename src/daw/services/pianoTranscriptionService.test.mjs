import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';

const serviceDirectory = new URL('.', import.meta.url).pathname;
const bundled = await build({
  stdin: {
    contents: `
      export { pianoTranscriptionService } from './pianoTranscriptionService.ts';
      export { noteScannerService } from './noteScannerService.ts';
    `,
    loader: 'ts',
    resolveDir: serviceDirectory,
    sourcefile: 'piano-transcription-hq-test-entry.ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  define: {
    'import.meta.env.BASE_URL': '"/"',
    'import.meta.url': '"file:///piano-transcription-hq-test-entry.ts"',
  },
  external: ['@spotify/basic-pitch', '@tensorflow/tfjs'],
});

const bundledModule = { exports: {} };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(
  require,
  bundledModule,
  bundledModule.exports,
);

const { pianoTranscriptionService, noteScannerService } = bundledModule.exports;

const makeAudioBuffer = () => {
  const sampleRate = 8_000;
  const samples = new Float32Array(sampleRate);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.sin((2 * Math.PI * 220 * index) / sampleRate) * 0.08;
  }

  return {
    duration: 1,
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
    getChannelData: () => samples,
  };
};

const denseHighConfidenceResult = () => ({
  notes: [
    { pitch: 48, start: 0, duration: 2, velocity: 96, confidence: 0.94, frequency: 130.81 },
    { pitch: 60, start: 0, duration: 2, velocity: 104, confidence: 0.96, frequency: 261.63 },
    { pitch: 64, start: 0, duration: 2, velocity: 101, confidence: 0.95, frequency: 329.63 },
    { pitch: 67, start: 0, duration: 2, velocity: 99, confidence: 0.93, frequency: 392 },
  ],
  averageConfidence: 0.945,
  durationSeconds: 1,
  analyzedFrames: 172,
  settings: {
    mode: 'polyphonic',
    sensitivity: 0.73,
    minMidi: 21,
    maxMidi: 108,
    maxPolyphony: 10,
    quantize: false,
    quantizeStep16th: 1,
    minDuration16th: 0.4,
  },
  backendUsed: 'webgl+physical',
  scanElapsedMs: 12,
  processedChunks: 1,
});

test('Piano HQ web always invokes the neural-plus-physical scanner exactly once for a dense result', async () => {
  const originalScan = noteScannerService.scanAudioBuffer;
  const previousWorker = globalThis.Worker;
  let canonicalScanCalls = 0;
  let directWorkerCalls = 0;

  noteScannerService.scanAudioBuffer = async () => {
    canonicalScanCalls += 1;
    return denseHighConfidenceResult();
  };
  globalThis.Worker = class UnexpectedDirectPhysicalWorker {
    constructor() {
      directWorkerCalls += 1;
      throw new Error('HQ must not start a separate FFT-only worker.');
    }
  };

  try {
    const result = await pianoTranscriptionService.transcribeAudioBuffer(makeAudioBuffer(), 120);
    assert.equal(canonicalScanCalls, 1);
    assert.equal(directWorkerCalls, 0);
    assert.equal(result.scanResult.backendUsed, 'webgl+physical');
  } finally {
    noteScannerService.scanAudioBuffer = originalScan;
    if (previousWorker === undefined) {
      delete globalThis.Worker;
    } else {
      globalThis.Worker = previousWorker;
    }
  }
});

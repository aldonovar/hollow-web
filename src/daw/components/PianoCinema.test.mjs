import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const componentUrl = new URL('./PianoCinema.tsx', import.meta.url);
const source = await readFile(componentUrl, 'utf8');
const bundle = await build({
  entryPoints: [componentUrl.pathname],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/*'],
});
const bundledModule = { exports: {} };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(
  require,
  bundledModule,
  bundledModule.exports,
);
const PianoCinema = bundledModule.exports.default;

const NOTES = [
  { pitch: 48, start: 0, duration: 2, velocity: 72 },
  { pitch: 60, start: 4, duration: 2.5, velocity: 118 },
  { pitch: 76, start: 8, duration: 3, velocity: 102 },
];

const renderCinema = (overrides = {}) => renderToStaticMarkup(React.createElement(PianoCinema, {
  notes: NOTES,
  playhead16th: 0,
  bpm: 124,
  isPlaying: false,
  total16ths: 128,
  selectedNoteKey: null,
  activeNoteIndexes: [],
  livePitches: [],
  sustainActive: false,
  ...overrides,
}));

test('Piano Cinema uses a restrained studio surface without Nebula styling', () => {
  const markup = renderCinema();

  assert.match(markup, /data-piano-cinema="studio"/);
  assert.match(markup, /data-piano-cinema-stage="true"/);
  assert.match(markup, /data-piano-cinema-keyboard="true"/);
  assert.equal((markup.match(/preserveAspectRatio="none"/g) ?? []).length, 2);
  assert.doesNotMatch(source, /\b(?:aurora|nebula|neon|perspective|star-field|active-glow)\b/i);
  assert.doesNotMatch(source, /(?:radial-gradient|shadow-\[|text-cyan|text-fuchsia|text-emerald)/i);
});

test('Piano Cinema bounds long-project ribbon work and exposes keyboard transport controls', () => {
  const markup = renderCinema({ total16ths: 16 * 2_000 });
  const markerCount = markup.match(/data-piano-cinema-ribbon-marker=/g)?.length ?? 0;

  assert.ok(markerCount > 0);
  assert.ok(markerCount <= 48);
  assert.match(markup, /role="slider"/);
  assert.match(markup, /aria-label="Posición del transporte de Falling Notes"/);
  assert.match(markup, /aria-valuemax="32000"/);
  assert.match(markup, /motion-reduce:transition-none/);
});

test('Piano Cinema keeps notes accessible and renders the audible transposed pitch', () => {
  const markup = renderCinema({
    activeNoteIndexes: [1],
    pitchShiftSemitones: 12,
    sustainActive: true,
  });

  assert.match(markup, /role="button"/);
  assert.match(markup, /aria-label="C5, inicio 4\.00, duración 2\.50, velocidad 118"/);
  assert.match(markup, /data-piano-key="C5"/);
  assert.match(markup, /Audio \+12 st/);
  assert.match(markup, /aria-label="Velocidad de la nota seleccionada"/);
});

test('Piano Cinema preserves product guidance for an empty score', () => {
  const markup = renderCinema({
    notes: [],
    emptyTitle: 'Importa una interpretación',
    emptyMessage: 'Las notas aparecerán aquí cuando termine el análisis.',
  });

  assert.match(markup, /Importa una interpretación/);
  assert.match(markup, /Las notas aparecerán aquí cuando termine el análisis\./);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8');
const boundarySource = readFileSync(new URL('./components/AppErrorBoundary.tsx', import.meta.url), 'utf8');
const dawAppSource = readFileSync(new URL('./daw/App.tsx', import.meta.url), 'utf8');
const hardwareSettingsSource = readFileSync(new URL('./daw/components/HardwareSettingsModal.tsx', import.meta.url), 'utf8');

test('mounts the whole web application inside a recovery boundary', () => {
  assert.match(mainSource, /<AppErrorBoundary>[\s\S]*?<App \/>[\s\S]*?<\/AppErrorBoundary>/);
});

test('renders a non-empty, non-destructive fallback with retry and reload actions', () => {
  assert.match(boundarySource, /data-app-error-fallback="true"/);
  assert.match(boundarySource, /Tus proyectos locales no se eliminan/);
  assert.match(boundarySource, /Reintentar interfaz/);
  assert.match(boundarySource, /Recargar DAW-fi/);
  assert.doesNotMatch(boundarySource, /localStorage\.clear|indexedDB\.deleteDatabase/);
});

test('keeps common user-facing DAW recovery and hardware copy valid UTF-8', () => {
  assert.doesNotMatch(`${dawAppSource}\n${hardwareSettingsSource}`, /Ã|Â|â†|�/);
});

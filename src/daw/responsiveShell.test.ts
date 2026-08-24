import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const appSource = readSource('./App.tsx');
const transportSource = readSource('./components/Transport.tsx');
const stylesheet = readSource('./index.css');

test('the DAW shell uses dynamic viewport units and safe-area insets', () => {
    assert.match(appSource, /daw-immersive-shell daw-viewport/);
    assert.doesNotMatch(appSource, /daw-immersive-shell[^\n]*h-screen w-screen/);
    assert.match(stylesheet, /height:\s*100dvh/);
    assert.match(stylesheet, /env\(safe-area-inset-top/);
    assert.match(stylesheet, /env\(safe-area-inset-bottom/);
});

test('play and stop remain named, first-class transport actions', () => {
    assert.match(transportSource, /data-transport-action="play"/);
    assert.match(transportSource, /data-transport-action="stop"/);
    assert.match(transportSource, /aria-label="Reproducir"/);
    assert.match(transportSource, /aria-label="Detener"/);
    assert.match(stylesheet, /\.daw-transport-action[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
});

test('secondary tools have explicit mobile drawer and dock hooks', () => {
    for (const hook of [
        'daw-tool-rail',
        'daw-browser-drawer',
        'daw-ai-drawer-portal',
        'daw-main-surface',
        'daw-bottom-panel'
    ]) {
        assert.ok(appSource.includes(hook), `missing ${hook}`);
    }
    assert.match(stylesheet, /@media \(max-width:\s*767px\)/);
    assert.match(stylesheet, /\.daw-tool-rail[\s\S]*?overflow-x:\s*auto/);
    assert.match(stylesheet, /\.daw-browser-drawer,[\s\S]*?\.daw-ai-drawer-portal > div/);
});

test('short landscape keeps a scrollable tool rail and compact lower panel', () => {
    assert.match(stylesheet, /@media \(max-height:\s*500px\) and \(orientation:\s*landscape\)/);
    assert.match(stylesheet, /\.daw-tool-rail[\s\S]*?overflow-y:\s*auto/);
    assert.match(stylesheet, /\.daw-bottom-panel[\s\S]*?height:\s*110px !important/);
});

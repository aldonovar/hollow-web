import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const appSource = readSource('./App.tsx');
const transportSource = readSource('./components/Transport.tsx');
const pianoScoreSource = readSource('./components/PianoScoreWorkspace.tsx');
const pianoCinemaSource = readSource('./components/PianoCinema.tsx');
const trackHeaderSource = readSource('./components/TrackHeader.tsx');
const stylesheet = readSource('./index.css');
const settingsSource = readSource('../pages/Settings.tsx');
const settingsStylesheet = readSource('../pages/Settings.css');

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
    assert.match(transportSource, /aria-label="Detener y volver al inicio"/);
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

test('mobile Session keeps every scene vertically reachable with touch-sized launch controls', () => {
    assert.match(stylesheet, /\.daw-primary-view > \.flex-1:has\(button\[title\^="Lanzar escena "\]\)[\s\S]*?overflow-y:\s*auto !important/);
    assert.match(stylesheet, /button\[title\^="Lanzar escena "\][\s\S]*?min-height:\s*44px/);
    assert.match(stylesheet, /button\[title="Scene Recording"\][\s\S]*?height:\s*44px !important/);
});

test('short landscape constrains AI and project drawers inside the live workspace', () => {
    const landscapeRules = stylesheet.slice(stylesheet.indexOf('@media (max-height: 500px) and (orientation: landscape)'));
    assert.match(landscapeRules, /\.daw-ai-drawer-portal > div[\s\S]*?top:\s*0 !important[\s\S]*?bottom:\s*0 !important[\s\S]*?z-index:\s*80 !important/);
    assert.match(landscapeRules, /\.daw-file-menu,[\s\S]*?bottom:\s*calc\(44px \+ env\(safe-area-inset-bottom, 0px\)\) !important[\s\S]*?overflow-y:\s*auto/);
    assert.match(landscapeRules, /\.daw-status-bar[\s\S]*?min-height:\s*44px/);
});

test('mobile Timeline and device controls expose 44px touch targets without widening the document', () => {
    assert.match(stylesheet, /\.daw-arrange-timeline button:not\(\[class\*="opacity-0"\]\),[\s\S]*?min-height:\s*44px/);
    assert.match(stylesheet, /grid-template-columns:\s*repeat\(4, 44px\) !important/);
    assert.match(stylesheet, /\.daw-bottom-panel \.group\.relative\.select-none > div:first-child button,[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
});

test('Score + Keys uses touch-sized mobile tabs and horizontal controls', () => {
    assert.match(pianoScoreSource, /useState<'score' \| 'keys'>/);
    assert.match(pianoScoreSource, /md:hidden/);
    assert.match(pianoScoreSource, /mobilePanel === 'score'/);
    assert.match(pianoScoreSource, /mobilePanel === 'keys'/);
    assert.match(pianoScoreSource, /role="tablist"/);
    assert.match(pianoScoreSource, /aria-selected=\{mobilePanel/);
    assert.match(pianoScoreSource, /h-11 md:h-8/);
    assert.match(pianoScoreSource, /h-11 w-11/);
    assert.match(pianoScoreSource, /overflow-x-auto/);
    assert.match(pianoScoreSource, /overscroll-x-contain/);
    assert.match(pianoCinemaSource, /h-11 w-full/);
});

test('Score + Keys keeps its primary analysis and transport controls directly reachable on mobile', () => {
  const source = readFileSync(new URL('./components/PianoScoreWorkspace.tsx', import.meta.url), 'utf8');

  assert.match(source, /data-mobile-score-controls/);
  assert.match(source, /aria-label=\{`Controles táctiles de \$\{productName\}`\}/);
  assert.match(source, /className=\{`\$\{secondaryAccentButtonClass\} col-span-6 w-full justify-center`\}/);
  assert.match(source, /className="hidden md:contents"/);
});

test('Keys-fi captures and cancels pointer drags on touch devices', () => {
    assert.match(pianoCinemaSource, /touch-none/);
    assert.match(pianoCinemaSource, /svgRef\.current\?\.setPointerCapture\?\.\(event\.pointerId\)/);
    assert.match(pianoCinemaSource, /releasePointerCapture\(event\.pointerId\)/);
    assert.match(pianoCinemaSource, /onLostPointerCapture/);
    assert.match(pianoCinemaSource, /addEventListener\('pointercancel'/);
    assert.match(pianoCinemaSource, /event\.pointerId !== dragState\.pointerId/);
});

test('destructive track actions stay named, focusable and touch reachable', () => {
    assert.match(trackHeaderSource, /daw-track-delete-action/);
    assert.match(trackHeaderSource, /aria-label=\{`Eliminar pista \$\{track\.name\}`\}/);
    assert.match(trackHeaderSource, /focus-visible:opacity-100/);
    assert.match(stylesheet, /\.daw-track-delete-action[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px[\s\S]*?opacity:\s*1 !important/);
});

test('active-device management remains readable and touch reachable at mobile widths', () => {
    assert.match(settingsSource, /className="settings__session-main"/);
    assert.match(settingsSource, /className="settings__session-meta"/);
    assert.match(settingsSource, /className="settings__session-revoke"/);
    assert.match(settingsSource, /aria-label=\{isCurrent \? 'Sesión actual;/);
    assert.match(settingsStylesheet, /@media \(max-width:\s*700px\)/);
    assert.match(settingsStylesheet, /\.settings__session-meta\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    assert.match(settingsStylesheet, /\.settings__session-revoke\s*\{[\s\S]*?width:\s*44px[\s\S]*?height:\s*44px/);
    assert.match(settingsStylesheet, /\.settings__save-btn,[\s\S]*?min-height:\s*44px/);
});

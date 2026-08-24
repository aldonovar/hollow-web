import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const routerSource = readSource('./App.tsx');
const consoleSource = readSource('./pages/Console.tsx');
const dawSource = readSource('./daw/App.tsx');
const workspaceSource = readSource('./daw/components/PianoScoreWorkspace.tsx');
const cinemaSource = readSource('./daw/components/PianoCinema.tsx');
const siteStyles = readSource('./index.css');
const dawStyles = readSource('./daw/index.css');
const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');

const collectTsxFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return collectTsxFiles(path);
  return extname(entry.name) === '.tsx' ? [path] : [];
});

test('Hub exposes independent DAW-fi Studio, Score-fi and Keys-fi products', () => {
  for (const [name, path] of [
    ['DAW-fi Studio', '/engine'],
    ['Score-fi', '/score'],
    ['Keys-fi', '/keys'],
  ] as const) {
    assert.ok(consoleSource.includes(`name: '${name}'`), `missing ${name} catalog entry`);
    assert.ok(consoleSource.includes(`path: '${path}'`), `missing ${path} catalog path`);
  }
  assert.match(consoleSource, /className="console-products__grid"/);
  assert.match(consoleSource, /aria-label=\{`\$\{product\.action\}: \$\{product\.description\}`\}/);
});

test('SPA router gives every product a reloadable route and product title', () => {
  assert.match(routerSource, /path="\/engine"[\s\S]*?<DawProductRoute mode="studio"/);
  assert.match(routerSource, /path="\/score" element=\{<DawProductRoute mode="score"/);
  assert.match(routerSource, /path="\/keys" element=\{<DawProductRoute mode="keys"/);
  assert.match(routerSource, /Score-fi \| Hollow Bits/);
  assert.match(routerSource, /Keys-fi \| Hollow Bits/);
  assert.match(redirects, /^\/\*\s+\/index\.html\s+200/m);
});

test('product routes reuse one DAW engine and select a presentation-only surface mode', () => {
  assert.match(dawSource, /export type DawSurfaceMode = 'studio' \| 'score' \| 'keys'/);
  assert.match(dawSource, /surfaceMode === 'studio' \? 'combined' : surfaceMode/);
  assert.match(dawSource, /<PianoScoreWorkspace[\s\S]*surfaceMode=\{scoreSurfaceMode\}/);
  assert.equal((routerSource.match(/lazy\(\(\) => import\('\.\/daw\/App'\)\)/g) ?? []).length, 1);
  assert.match(dawSource, /aria-current=\{surfaceMode === 'studio' \? 'page' : undefined\}>DAW-fi Studio/);
});

test('Score-fi renders notation only and Keys-fi renders the interpretation visualizer only', () => {
  assert.match(workspaceSource, /export type PianoScoreSurfaceMode = 'combined' \| 'score' \| 'keys'/);
  assert.match(workspaceSource, /\{!isKeysSurface && \(/);
  assert.match(workspaceSource, /<ScoreViewport/);
  assert.match(workspaceSource, /\{!isScoreSurface && \(/);
  assert.match(workspaceSource, /<PianoCinema/);
  assert.match(workspaceSource, /isCombinedSurface && <div/);
});

test('legacy product wording is absent from all visible React copy and accessibility text', () => {
  const sourceRoot = new URL('.', import.meta.url).pathname;
  const visibleSources = collectTsxFiles(sourceRoot).map((path) => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(visibleSources, /falling[ -]notes/i);
  assert.match(cinemaSource, /Posición del transporte de Keys-fi/);
  assert.match(cinemaSource, /Visualizador de interpretación Keys-fi/);
});

test('Hub cards and standalone product navigation remain usable on narrow screens', () => {
  assert.match(siteStyles, /\.hero\{[^}]*overflow:hidden/);
  assert.match(siteStyles, /\.console-products__grid\{[\s\S]*grid-template-columns:repeat\(3/);
  assert.match(siteStyles, /@media\(max-width:900px\)[\s\S]*\.console-products__grid\{grid-template-columns:1fr\}/);
  assert.match(dawStyles, /\.daw-product-switcher__link\{[\s\S]*white-space:nowrap/);
  assert.match(dawStyles, /@media\(max-width:640px\)[\s\S]*\.daw-product-switcher button\{height:44px;min-height:44px\}/);
});

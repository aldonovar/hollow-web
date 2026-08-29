import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSessionDate, maskSessionIp, normalizeUserAgent } from './sessionPresentation.ts';

test('identifies DAW-fi Desktop from the token-exchange user agent or session tag', () => {
  assert.deepEqual(normalizeUserAgent('DAW-fi Desktop'), {
    label: 'DAW-fi Desktop',
    kind: 'desktop',
  });
  assert.deepEqual(normalizeUserAgent('node', 'daw-fi-desktop'), {
    label: 'DAW-fi Desktop',
    kind: 'desktop',
  });
  assert.deepEqual(normalizeUserAgent('Mozilla/5.0 Chrome/140 Electron/42.0'), {
    label: 'DAW-fi Desktop',
    kind: 'desktop',
  });
});

test('distinguishes mobile and desktop browsers', () => {
  assert.deepEqual(normalizeUserAgent('Mozilla/5.0 (Linux; Android 16) Chrome/140 Mobile'), {
    label: 'Chrome · móvil',
    kind: 'mobile',
  });
  assert.deepEqual(normalizeUserAgent('Mozilla/5.0 (X11; Linux x86_64) Firefox/142.0'), {
    label: 'Firefox · escritorio',
    kind: 'desktop',
  });
});

test('masks session addresses and rejects invalid dates without exposing raw values', () => {
  assert.equal(maskSessionIp('192.168.50.21'), '192.168.•••.•••');
  assert.equal(maskSessionIp('2001:db8:85a3::8a2e:370:7334'), '2001:db8:••••');
  assert.equal(maskSessionIp(null), 'No disponible');
  assert.equal(formatSessionDate('not-a-date'), 'No disponible');
});

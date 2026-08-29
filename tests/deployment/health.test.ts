import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET, HEAD } from '../../api/health.ts';

test('production health endpoint returns DAW-fi JSON without caching', async () => {
  const response = GET();
  const payload = await response.json() as { status?: string; service?: string; runtime?: string };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(
    { status: payload.status, service: payload.service, runtime: payload.runtime },
    { status: 'ok', service: 'DAW-fi Web', runtime: 'vercel' },
  );
});

test('health HEAD response is bodyless and the SPA fallback excludes API routes', async () => {
  const response = HEAD();
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');

  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
    rewrites?: Array<{ source?: string; destination?: string }>;
  };
  assert.equal(config.rewrites?.[0]?.destination, '/index.html');
  assert.match(config.rewrites?.[0]?.source ?? '', /\(\?!api/);
});

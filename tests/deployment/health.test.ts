import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET, HEAD } from '../../api/health.ts';

type VercelHeader = { key?: string; value?: string };
type VercelHeaderRule = { source?: string; headers?: VercelHeader[] };

async function readVercelConfig() {
  return JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
    rewrites?: Array<{ source?: string; destination?: string }>;
    headers?: VercelHeaderRule[];
  };
}

function headersFor(config: Awaited<ReturnType<typeof readVercelConfig>>, source: string) {
  return new Map(
    config.headers
      ?.find((rule) => rule.source === source)
      ?.headers
      ?.map(({ key, value }) => [key, value]) ?? [],
  );
}

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

  const config = await readVercelConfig();
  assert.equal(config.rewrites?.[0]?.destination, '/index.html');
  assert.match(config.rewrites?.[0]?.source ?? '', /\(\?!api/);
});

test('Vercel serves the security and immutable asset headers used by production', async () => {
  const config = await readVercelConfig();
  const globalHeaders = headersFor(config, '/(.*)');
  const assetHeaders = headersFor(config, '/assets/(.*)');
  const desktopAuthHeaders = headersFor(config, '/desktop-auth');

  assert.equal(globalHeaders.get('X-Frame-Options'), 'DENY');
  assert.equal(globalHeaders.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(globalHeaders.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(globalHeaders.get('Cross-Origin-Opener-Policy'), 'same-origin');
  assert.equal(globalHeaders.get('Cross-Origin-Embedder-Policy'), 'require-corp');
  assert.match(globalHeaders.get('Strict-Transport-Security') ?? '', /includeSubDomains/);
  assert.match(globalHeaders.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
  assert.equal(assetHeaders.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(desktopAuthHeaders.get('Cache-Control'), 'no-store');
  assert.equal(desktopAuthHeaders.get('Referrer-Policy'), 'no-referrer');
});

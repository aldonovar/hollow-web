import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkspaceSlug } from './workspaceSlug.ts';

const VALID_WORKSPACE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test('workspace slugs normalize accents and use deterministic collision entropy', () => {
  assert.equal(buildWorkspaceSlug('  Música & Producción  ', 0), 'musica-produccion-0000000');
});

test('workspace slugs remain valid when truncation lands on a separator', () => {
  const name = `${'a'.repeat(95)} b`;
  const slug = buildWorkspaceSlug(name, 1);

  assert.match(slug, VALID_WORKSPACE_SLUG);
  assert.equal(slug.includes('--'), false);
  assert.ok(slug.length <= 128);
});

test('workspace slugs fall back safely when the name has no ASCII letters or digits', () => {
  assert.equal(buildWorkspaceSlug('  🎹  ', 35), 'workspace-000000z');
});

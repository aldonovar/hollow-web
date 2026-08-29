import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertDawfiSupabaseUrl,
  DAWFI_AUTH_CONTRACT,
  isDawfiSupabaseUrl,
} from './authContract.ts';

test('web and desktop authentication share the restored DAW-fi project contract', () => {
  assert.deepEqual(DAWFI_AUTH_CONTRACT.scopes, ['openid', 'email', 'profile']);
  assert.equal(DAWFI_AUTH_CONTRACT.projectRef, 'xnmkoybfuyivmiuckpxs');
  assert.equal(DAWFI_AUTH_CONTRACT.supabaseUrl, 'https://xnmkoybfuyivmiuckpxs.supabase.co');
  assert.equal(DAWFI_AUTH_CONTRACT.socialAuthorizationPath, '/auth/v1/authorize');
  assert.equal(DAWFI_AUTH_CONTRACT.socialTokenPath, '/auth/v1/token');
  assert.equal(DAWFI_AUTH_CONTRACT.oauthAuthorizationPath, '/auth/v1/oauth/authorize');
  assert.equal(DAWFI_AUTH_CONTRACT.oauthTokenPath, '/auth/v1/oauth/token');
  assert.equal(DAWFI_AUTH_CONTRACT.oauthConsentPath, '/oauth/consent');
  assert.equal(DAWFI_AUTH_CONTRACT.authCallbackPath, '/auth/callback');
  assert.equal(DAWFI_AUTH_CONTRACT.siteOrigin, 'https://www.hollowbits.com');
  assert.equal(DAWFI_AUTH_CONTRACT.canonicalAuthOrigin, 'https://play.hollowbits.com');
  assert.equal(DAWFI_AUTH_CONTRACT.desktopBridgeUrl, 'https://www.hollowbits.com/desktop-auth');
  assert.equal(DAWFI_AUTH_CONTRACT.desktopRedirectUri, 'dawfi://auth/callback');
});

test('the web client refuses another Supabase project', () => {
  assert.equal(isDawfiSupabaseUrl(`${DAWFI_AUTH_CONTRACT.supabaseUrl}/`), true);
  assert.equal(assertDawfiSupabaseUrl(`${DAWFI_AUTH_CONTRACT.supabaseUrl}/rest/v1`), DAWFI_AUTH_CONTRACT.supabaseUrl);
  assert.throws(
    () => assertDawfiSupabaseUrl('https://wrong-project.supabase.co'),
    /xnmkoybfuyivmiuckpxs/,
  );
});

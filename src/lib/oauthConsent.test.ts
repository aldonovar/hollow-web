import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOAuthConsentLoginPath,
  buildOAuthConsentPath,
  DAWFI_DESKTOP_REDIRECT_URI,
  getSafeDawfiDesktopRedirectUrl,
  LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI,
  readOAuthAuthorizationId,
  sanitizeOAuthConsentNextPath,
} from './oauthConsent.ts';

const AUTHORIZATION_ID = '3b27ba9f-fc12-4479-91f7-4bcb28554be8';
const STATE = 'state_0123456789abcdef0123456789';

test('accepts one canonical authorization identifier', () => {
  assert.equal(
    readOAuthAuthorizationId(`?authorization_id=${AUTHORIZATION_ID}`),
    AUTHORIZATION_ID,
  );
  assert.equal(
    buildOAuthConsentPath(AUTHORIZATION_ID),
    `/oauth/consent?authorization_id=${AUTHORIZATION_ID}`,
  );
});

test('rejects missing, duplicate, malformed, or decorated authorization identifiers', () => {
  assert.equal(readOAuthAuthorizationId(''), null);
  assert.equal(readOAuthAuthorizationId('?authorization_id=short'), null);
  assert.equal(
    readOAuthAuthorizationId(
      `?authorization_id=${AUTHORIZATION_ID}&authorization_id=${AUTHORIZATION_ID}`,
    ),
    null,
  );
  assert.equal(
    readOAuthAuthorizationId(`?authorization_id=${AUTHORIZATION_ID}&next=/console`),
    null,
  );
});

test('preserves only a canonical consent path through login', () => {
  const consentPath = `/oauth/consent?authorization_id=${AUTHORIZATION_ID}`;
  assert.equal(sanitizeOAuthConsentNextPath(consentPath), consentPath);
  assert.equal(sanitizeOAuthConsentNextPath(`${consentPath}#unexpected`), null);
  assert.equal(sanitizeOAuthConsentNextPath(`//evil.example${consentPath}`), null);
  assert.equal(
    sanitizeOAuthConsentNextPath(`${consentPath}&redirect=https://evil.example`),
    null,
  );

  const loginUrl = new URL(buildOAuthConsentLoginPath(AUTHORIZATION_ID), 'https://play.hollowbits.com');
  assert.equal(loginUrl.pathname, '/login');
  assert.equal(loginUrl.searchParams.get('next'), consentPath);
  assert.equal([...loginUrl.searchParams.keys()].length, 1);
});

test('accepts the primary DAW-fi Supabase success redirect without rebuilding it', () => {
  const redirect = `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code_123456789&state=${STATE}`;
  assert.equal(getSafeDawfiDesktopRedirectUrl(redirect), redirect);
  assert.equal(getSafeDawfiDesktopRedirectUrl(redirect, DAWFI_DESKTOP_REDIRECT_URI), redirect);
});

test('accepts the transitional HOLLOW bits callback only as an exact registered redirect', () => {
  const redirect = `${LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI}?code=legacy-one-time-code&state=${STATE}`;
  assert.equal(getSafeDawfiDesktopRedirectUrl(redirect), redirect);
  assert.equal(
    getSafeDawfiDesktopRedirectUrl(redirect, LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI),
    redirect,
  );
  assert.equal(getSafeDawfiDesktopRedirectUrl(redirect, DAWFI_DESKTOP_REDIRECT_URI), null);
});

test('accepts the exact Supabase denial redirect', () => {
  const redirect = `${DAWFI_DESKTOP_REDIRECT_URI}?error=access_denied&error_description=User+cancelled&state=${STATE}`;
  assert.equal(getSafeDawfiDesktopRedirectUrl(redirect), redirect);
});

test('rejects redirects outside the DAW-fi desktop callback contract', () => {
  const forbiddenCredentialParameter = `access${'_token'}`;

  for (const redirect of [
    `https://evil.example/callback?code=one-time-code&state=${STATE}`,
    `hollowbits://evil/callback?code=one-time-code&state=${STATE}`,
    `hollowbits://auth/other?code=one-time-code&state=${STATE}`,
    `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code`,
    `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code&state=${STATE}&state=${STATE}`,
    `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code&state=${STATE}#fragment`,
    `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code&state=${STATE}&${forbiddenCredentialParameter}=secret`,
    `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code&error=access_denied&state=${STATE}`,
    `${DAWFI_DESKTOP_REDIRECT_URI}/extra?code=one-time-code&state=${STATE}`,
    `hollow://auth/callback?code=one-time-code&state=${STATE}`,
  ]) {
    assert.equal(getSafeDawfiDesktopRedirectUrl(redirect), null, redirect);
  }

  const primaryRedirect = `${DAWFI_DESKTOP_REDIRECT_URI}?code=one-time-code&state=${STATE}`;
  assert.equal(
    getSafeDawfiDesktopRedirectUrl(primaryRedirect, LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI),
    null,
  );
});

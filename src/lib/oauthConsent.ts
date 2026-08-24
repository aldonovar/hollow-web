import { DAWFI_AUTH_CONTRACT } from './authContract.ts';

export const OAUTH_CONSENT_PATH = DAWFI_AUTH_CONTRACT.oauthConsentPath;
export const DAWFI_DESKTOP_REDIRECT_URI = DAWFI_AUTH_CONTRACT.desktopRedirectUri;
export const LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI = DAWFI_AUTH_CONTRACT.legacyDesktopRedirectUri;

const INTERNAL_ORIGIN = 'https://dawfi.invalid';
const AUTHORIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9._~-]{16,512}$/;
const OAUTH_CODE_PATTERN = /^[A-Za-z0-9._~-]{8,4096}$/;
const OAUTH_ERROR_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
const ALLOWED_REDIRECT_PARAMETERS = new Set([
  'code',
  'state',
  'error',
  'error_description',
]);
const ALLOWED_DESKTOP_REDIRECT_URIS = new Set([
  DAWFI_DESKTOP_REDIRECT_URI,
  LEGACY_HOLLOWBITS_DESKTOP_REDIRECT_URI,
]);

function isBoundedPrintableValue(
  value: string | null,
  maximumLength: number,
  minimumLength = 1,
): value is string {
  return Boolean(
    value
    && value.length >= minimumLength
    && value.length <= maximumLength
    && !/[\u0000-\u001f\u007f]/.test(value),
  );
}

export function isValidOAuthAuthorizationId(value: string | null | undefined): value is string {
  return Boolean(value && AUTHORIZATION_ID_PATTERN.test(value));
}

export function readOAuthAuthorizationId(search: string): string | null {
  const params = new URLSearchParams(search);
  const values = params.getAll('authorization_id');
  const keys = [...params.keys()];

  if (
    values.length !== 1
    || keys.length !== 1
    || keys[0] !== 'authorization_id'
    || !isValidOAuthAuthorizationId(values[0])
  ) {
    return null;
  }

  return values[0];
}

export function buildOAuthConsentPath(authorizationId: string): string {
  if (!isValidOAuthAuthorizationId(authorizationId)) {
    throw new Error('Invalid OAuth authorization request.');
  }

  const params = new URLSearchParams({ authorization_id: authorizationId });
  return `${OAUTH_CONSENT_PATH}?${params.toString()}`;
}

export function sanitizeOAuthConsentNextPath(rawPath: string | null | undefined): string | null {
  if (!rawPath || !rawPath.startsWith('/') || rawPath.startsWith('//') || rawPath.includes('\\')) {
    return null;
  }

  try {
    const parsed = new URL(rawPath, INTERNAL_ORIGIN);
    if (
      parsed.origin !== INTERNAL_ORIGIN
      || parsed.pathname !== OAUTH_CONSENT_PATH
      || parsed.hash
      || parsed.username
      || parsed.password
    ) {
      return null;
    }

    const authorizationId = readOAuthAuthorizationId(parsed.search);
    return authorizationId ? buildOAuthConsentPath(authorizationId) : null;
  } catch {
    return null;
  }
}

export function buildOAuthConsentLoginPath(authorizationId: string): string {
  const nextPath = buildOAuthConsentPath(authorizationId);
  const params = new URLSearchParams({ next: nextPath });
  return `/login?${params.toString()}`;
}

export function isDawfiDesktopRedirectUri(value: string): boolean {
  return ALLOWED_DESKTOP_REDIRECT_URIS.has(value);
}

/**
 * Validate Supabase's complete redirect without reconstructing it. The original
 * string is returned so the browser navigates to exactly what Supabase signed.
 */
export function getSafeDawfiDesktopRedirectUrl(
  rawUrl: string,
  expectedRedirectUri?: string,
): string | null {
  if (
    !rawUrl
    || rawUrl.trim() !== rawUrl
    || /[\u0000-\u001f\u007f]/.test(rawUrl)
    || (expectedRedirectUri !== undefined && !isDawfiDesktopRedirectUri(expectedRedirectUri))
  ) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    const redirectBase = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;

    if (
      !isDawfiDesktopRedirectUri(redirectBase)
      || (expectedRedirectUri !== undefined && redirectBase !== expectedRedirectUri)
      || parsed.hostname !== 'auth'
      || parsed.port
      || parsed.pathname !== '/callback'
      || parsed.username
      || parsed.password
      || parsed.hash
    ) {
      return null;
    }

    const parameterKeys = [...parsed.searchParams.keys()];
    if (
      parameterKeys.some((key) => !ALLOWED_REDIRECT_PARAMETERS.has(key))
      || [...new Set(parameterKeys)].some((key) => parsed.searchParams.getAll(key).length !== 1)
    ) {
      return null;
    }

    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');
    const oauthError = parsed.searchParams.get('error');
    const errorDescription = parsed.searchParams.get('error_description');

    if (!state || !OAUTH_STATE_PATTERN.test(state)) {
      return null;
    }

    if (code) {
      if (
        oauthError
        || errorDescription
        || parameterKeys.length !== 2
        || !OAUTH_CODE_PATTERN.test(code)
      ) {
        return null;
      }
      return rawUrl;
    }

    if (
      !oauthError
      || !OAUTH_ERROR_PATTERN.test(oauthError)
      || parameterKeys.some((key) => !['error', 'error_description', 'state'].includes(key))
      || (errorDescription !== null && !isBoundedPrintableValue(errorDescription, 1024))
    ) {
      return null;
    }

    return rawUrl;
  } catch {
    return null;
  }
}

/**
 * Convert the HTTPS bridge query into the exact custom-protocol callback.
 * Only the short-lived PKCE code (or a provider error) and bound state cross
 * the bridge; session credentials are never accepted or reconstructed here.
 */
export function buildSafeDawfiDesktopCallbackFromSearch(search: string): string | null {
  if (
    !search
    || search.trim() !== search
    || search.includes('#')
    || /[\u0000-\u001f\u007f]/.test(search)
  ) {
    return null;
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const parameterKeys = [...params.keys()];
  if (
    parameterKeys.length === 0
    || parameterKeys.some((key) => !ALLOWED_REDIRECT_PARAMETERS.has(key))
    || [...new Set(parameterKeys)].some((key) => params.getAll(key).length !== 1)
  ) {
    return null;
  }

  const callback = new URL(DAWFI_DESKTOP_REDIRECT_URI);
  for (const [key, value] of params.entries()) {
    callback.searchParams.set(key, value);
  }

  return getSafeDawfiDesktopRedirectUrl(callback.toString(), DAWFI_DESKTOP_REDIRECT_URI);
}

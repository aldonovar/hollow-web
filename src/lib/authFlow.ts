import { supabase } from './supabase';
import { sanitizeOAuthConsentNextPath } from './oauthConsent';

export const CANONICAL_AUTH_ORIGIN = 'https://play.hollowbits.com';
export const AUTH_CALLBACK_PATH = '/auth/callback';

const PRODUCTION_AUTH_HOSTNAMES = new Set([
  'hollowbits.com',
  'www.hollowbits.com',
  'play.hollowbits.com',
  'console.hollowbits.com',
]);

const ALLOWED_AUTH_NEXT_PATHS = new Set([
  '/console',
  '/engine',
  '/settings',
]);

interface AuthLocation {
  hostname: string;
  origin: string;
}

function getRuntimeLocation(): AuthLocation {
  return window.location;
}

export function isProductionAuthHostname(hostname: string): boolean {
  return PRODUCTION_AUTH_HOSTNAMES.has(hostname.trim().toLowerCase());
}

export function sanitizeAuthNextPath(
  rawNext: string | null | undefined,
  fallback = '/console',
): string {
  const safeFallback = ALLOWED_AUTH_NEXT_PATHS.has(fallback) ? fallback : '/console';
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.includes('\\')) {
    return safeFallback;
  }

  const consentPath = sanitizeOAuthConsentNextPath(rawNext);
  if (consentPath) return consentPath;

  try {
    const parsed = new URL(rawNext, 'https://dawfi.invalid');
    if (parsed.origin !== 'https://dawfi.invalid' || !ALLOWED_AUTH_NEXT_PATHS.has(parsed.pathname)) {
      return safeFallback;
    }

    if (parsed.pathname !== '/engine') {
      return parsed.pathname;
    }

    const projectId = parsed.searchParams.get('project');
    if (!projectId || !/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) {
      return '/engine';
    }

    const safeSearch = new URLSearchParams({ project: projectId });
    return `/engine?${safeSearch.toString()}`;
  } catch {
    return safeFallback;
  }
}

export function readAuthNextFromSearch(search: string, fallback = '/console'): string {
  const params = new URLSearchParams(search);
  return sanitizeAuthNextPath(params.get('next'), fallback);
}

export function getAuthOrigin(location: AuthLocation = getRuntimeLocation()): string {
  return isProductionAuthHostname(location.hostname)
    ? CANONICAL_AUTH_ORIGIN
    : location.origin;
}

export function buildAuthCallbackUrl(
  rawNext: string | null | undefined,
  location: AuthLocation = getRuntimeLocation(),
): string {
  const url = new URL(AUTH_CALLBACK_PATH, getAuthOrigin(location));
  url.searchParams.set('next', sanitizeAuthNextPath(rawNext));
  return url.toString();
}

export function buildCanonicalLoginUrl(
  rawNext: string | null | undefined,
  autoStartGoogle = false,
): string {
  const url = new URL('/login', CANONICAL_AUTH_ORIGIN);
  url.searchParams.set('next', sanitizeAuthNextPath(rawNext));
  if (autoStartGoogle) url.searchParams.set('oauth', 'google');
  return url.toString();
}

export async function beginGoogleSignIn(
  rawNext: string | null | undefined = '/console',
): Promise<void> {
  const location = getRuntimeLocation();
  const nextPath = sanitizeAuthNextPath(rawNext);

  if (
    isProductionAuthHostname(location.hostname)
    && location.origin !== CANONICAL_AUTH_ORIGIN
  ) {
    window.location.assign(buildCanonicalLoginUrl(nextPath, true));
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildAuthCallbackUrl(nextPath, location),
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) throw error;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'No se pudo iniciar sesión. Intenta nuevamente.';
}

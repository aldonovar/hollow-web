import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8');
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  }));
  return nested.flat();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(source, needle) {
  return source.split(needle).length - 1;
}

const [
  supabaseClient,
  authFlow,
  authCallback,
  app,
  authPage,
  collabAuth,
  miniAuth,
  consolePage,
  authStore,
  desktopBridge,
  oauthConsentPage,
  oauthConsentContract,
] = await Promise.all([
  read('src/lib/supabase.ts'),
  read('src/lib/authFlow.ts'),
  read('src/pages/AuthCallback.tsx'),
  read('src/App.tsx'),
  read('src/pages/Auth.tsx'),
  read('src/daw/components/CollabAuthModal.tsx'),
  read('src/daw/components/MiniAuthPanel.tsx'),
  read('src/pages/Console.tsx'),
  read('src/stores/authStore.ts'),
  read('src/pages/DesktopAuthBridge.tsx'),
  read('src/pages/OAuthConsent.tsx'),
  read('src/lib/oauthConsent.ts'),
]);

const sourceFiles = await collectSourceFiles(path.join(repositoryRoot, 'src'));
const allSource = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');
const authContractSource = await read('src/lib/authContract.ts');
const authContract = JSON.parse(await read('src/lib/dawfi-auth.json'));

assert(supabaseClient.includes("flowType: 'pkce'"), 'Supabase Auth must use PKCE.');
assert(supabaseClient.includes('detectSessionInUrl: false'), 'OAuth callback exchange must be explicit.');
assert(supabaseClient.includes('assertDawfiSupabaseUrl'), 'The web client must reject another Supabase project.');
assert(!allSource.includes('document.cookie'), 'JavaScript session cookies are forbidden.');
assert(!allSource.includes('access_token'), 'Session access credentials must not appear in application URLs or source flows.');
assert(!allSource.includes('refresh_token'), 'Session refresh credentials must not appear in application URLs or source flows.');
assert(!authStore.includes('supabase.auth.setSession'), 'Auth store must not hydrate credentials from URL input.');

assert(authFlow.includes('DAWFI_AUTH_CONTRACT.canonicalAuthOrigin'), 'Production OAuth must use the shared canonical play origin.');
assert(authFlow.includes('DAWFI_AUTH_CONTRACT.authCallbackPath'), 'The callback path must come from the shared auth contract.');
assert(authFlow.includes('ALLOWED_AUTH_NEXT_PATHS'), 'OAuth next paths must be allowlisted.');
assert(authFlow.includes('sanitizeOAuthConsentNextPath'), 'OAuth consent return paths must be validated separately.');
assert(count(allSource, 'signInWithOAuth(') === 1, 'Google OAuth must have exactly one implementation.');
assert(authFlow.includes('signInWithOAuth('), 'The centralized OAuth helper is missing.');

for (const [name, source] of [
  ['Auth', authPage],
  ['CollabAuthModal', collabAuth],
  ['MiniAuthPanel', miniAuth],
]) {
  assert(source.includes('beginGoogleSignIn'), `${name} must use the centralized Google helper.`);
}

assert(app.includes('path="/auth/callback"'), 'The explicit OAuth callback route is missing.');
assert(app.includes('path="/oauth/consent"'), 'The Supabase OAuth consent route is missing.');
assert(authCallback.includes('exchangeCodeForSession'), 'The callback must exchange the PKCE code explicitly.');
assert(authCallback.includes('window.history.replaceState'), 'The callback code must be removed from browser history.');
assert(authPage.includes('emailRedirectTo: buildAuthCallbackUrl(nextPath)'), 'Email confirmation must use the explicit PKCE callback.');
assert(authPage.includes('Link to={alternateAuthPath}'), 'Login and signup navigation must preserve the validated return path.');
assert(consolePage.includes('buildCanonicalLoginUrl'), 'Cross-origin console launch must restart auth on the canonical origin.');

assert(oauthConsentPage.includes('getAuthorizationDetails'), 'Consent must load authorization details from Supabase.');
assert(oauthConsentPage.includes('approveAuthorization'), 'Consent must support explicit approval.');
assert(oauthConsentPage.includes('denyAuthorization'), 'Consent must support explicit denial.');
assert(count(oauthConsentPage, 'skipBrowserRedirect: true') === 2, 'Approve and deny must disable automatic redirects for local validation.');
assert(oauthConsentPage.includes('getSafeDawfiDesktopRedirectUrl'), 'Supabase redirect URLs must pass the desktop callback validator.');
assert(oauthConsentPage.includes('window.history.replaceState'), 'Unexpected consent URL fragments must be removed immediately.');
assert(oauthConsentContract.includes('DAWFI_AUTH_CONTRACT.desktopRedirectUri'), 'The primary desktop redirect URI must use the shared DAW-fi contract.');
assert(oauthConsentContract.includes('DAWFI_AUTH_CONTRACT.legacyDesktopRedirectUri'), 'The transitional HOLLOW bits redirect must remain in the shared contract.');
assert(oauthConsentContract.includes('ALLOWED_REDIRECT_PARAMETERS'), 'Desktop callback parameters must be allowlisted.');
assert(oauthConsentContract.includes('buildOAuthConsentLoginPath'), 'Unauthenticated consent must preserve a safe internal return path.');
assert(!oauthConsentPage.includes('console.log'), 'Consent must not log OAuth request or response data.');

assert(desktopBridge.includes('buildSafeDawfiDesktopCallbackFromSearch'), 'The Desktop bridge must validate the HTTPS callback before opening the app.');
assert(desktopBridge.includes('window.history.replaceState'), 'The Desktop bridge must remove code and state from browser history immediately.');
assert(desktopBridge.includes('window.location.assign'), 'The Desktop bridge must deliver the one-time code to the registered app protocol.');
assert(desktopBridge.includes('Esta página no puede confirmar por sí sola'), 'The Desktop bridge must not claim delivery without an app acknowledgement.');
assert(desktopBridge.includes('Cuando DAW-fi esté visible y muestre tu cuenta'), 'The Desktop bridge must explain when it is safe to close the browser tab.');
assert(desktopBridge.includes('Reintentar abrir DAW-fi'), 'The Desktop bridge must expose a clear manual protocol retry.');
assert(!desktopBridge.includes('window.close()'), 'The Desktop bridge must not auto-close without a delivery acknowledgement.');
assert(!desktopBridge.includes('Sesión enviada a DAW-fi'), 'The Desktop bridge still makes an unverified delivery claim.');
assert(oauthConsentContract.includes('buildSafeDawfiDesktopCallbackFromSearch'), 'The HTTPS bridge query must use the strict desktop callback validator.');
assert(!desktopBridge.includes('href='), 'Desktop bridge must not render a handoff link.');
assert(!desktopBridge.includes('console.'), 'Desktop bridge must not log OAuth request or response data.');

assert(authContract.projectRef === 'xnmkoybfuyivmiuckpxs', 'The shared contract points to the wrong Supabase project.');
assert(authContract.supabaseUrl === 'https://xnmkoybfuyivmiuckpxs.supabase.co', 'The shared Supabase origin is invalid.');
assert(authContract.canonicalAuthOrigin === 'https://play.hollowbits.com', 'The canonical auth origin drifted.');
assert(authContract.desktopBridgeUrl === 'https://www.hollowbits.com/desktop-auth', 'The Desktop HTTPS bridge drifted.');
assert(authContract.desktopRedirectUri === 'dawfi://auth/callback', 'The Desktop redirect drifted.');
assert(authContractSource.includes('isDawfiSupabaseUrl'), 'The shared contract lacks a project guard.');

console.log('Auth hardening contract passed.');

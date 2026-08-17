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
]);

const sourceFiles = await collectSourceFiles(path.join(repositoryRoot, 'src'));
const allSource = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');

assert(supabaseClient.includes("flowType: 'pkce'"), 'Supabase Auth must use PKCE.');
assert(supabaseClient.includes('detectSessionInUrl: false'), 'OAuth callback exchange must be explicit.');
assert(!allSource.includes('document.cookie'), 'JavaScript session cookies are forbidden.');
assert(!allSource.includes('access_token'), 'Session access credentials must not appear in application URLs or source flows.');
assert(!allSource.includes('refresh_token'), 'Session refresh credentials must not appear in application URLs or source flows.');
assert(!authStore.includes('supabase.auth.setSession'), 'Auth store must not hydrate credentials from URL input.');

assert(authFlow.includes("CANONICAL_AUTH_ORIGIN = 'https://play.hollowbits.com'"), 'Production OAuth must use the canonical play origin.');
assert(authFlow.includes('ALLOWED_AUTH_NEXT_PATHS'), 'OAuth next paths must be allowlisted.');
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
assert(authCallback.includes('exchangeCodeForSession'), 'The callback must exchange the PKCE code explicitly.');
assert(authCallback.includes('window.history.replaceState'), 'The callback code must be removed from browser history.');
assert(authPage.includes('emailRedirectTo: buildAuthCallbackUrl(nextPath)'), 'Email confirmation must use the explicit PKCE callback.');
assert(consolePage.includes('buildCanonicalLoginUrl'), 'Cross-origin console launch must restart auth on the canonical origin.');

assert(desktopBridge.includes('broker de código único'), 'Desktop handoff must remain blocked pending a one-time-code broker.');
assert(!desktopBridge.includes('window.location'), 'Desktop bridge must not construct or navigate to credential-bearing deep links.');
assert(!desktopBridge.includes('href='), 'Desktop bridge must not render a handoff link.');

console.log('Auth hardening contract passed.');

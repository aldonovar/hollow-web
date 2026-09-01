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
  createTeamModal,
  workspaceSlug,
  desktopHubVendor,
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
  read('src/components/CreateTeamModal.tsx'),
  read('src/lib/workspaceSlug.ts'),
  read('vendor/dawfi-core/components/desktop/DesktopHub.tsx'),
]);

const sourceFiles = await collectSourceFiles(path.join(repositoryRoot, 'src'));
const allSource = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');
const authContractSource = await read('src/lib/authContract.ts');
const authContract = JSON.parse(await read('src/lib/dawfi-auth.json'));
const legacyRlsMigration = await read(
  'supabase/migrations/20260830144311_optimize_legacy_rls_initplans.sql',
);

const legacyRlsSql = legacyRlsMigration
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/--.*$/gm, '')
  .trim();

const createdLegacyPolicies = [
  ...legacyRlsSql.matchAll(/create\s+policy\s+"([^"]+)"[\s\S]*?;/gi),
].map(([sql, name]) => ({ name, sql }));

const droppedLegacyPolicyNames = new Set(
  [...legacyRlsSql.matchAll(/drop\s+policy\s+if\s+exists\s+"([^"]+)"/gi)]
    .map(([, name]) => name),
);

const membershipPolicy = createdLegacyPolicies.find(
  ({ name }) => name === 'Owners and admins can add members',
)?.sql ?? '';

function extractFunctionSql(qualifiedName) {
  const escapedName = qualifiedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return legacyRlsSql.match(
    new RegExp(`create\\s+or\\s+replace\\s+function\\s+${escapedName}\\s*\\([\\s\\S]*?\\$\\$;`, 'i'),
  )?.[0] ?? '';
}

const membershipHelperSql = extractFunctionSql(
  'hollow_private.dawfi_can_add_workspace_member',
);
const createWorkspaceRpcSql = extractFunctionSql(
  'public.create_workspace_with_owner',
);
const preserveWorkspaceCreatorSql = extractFunctionSql(
  'hollow_private.dawfi_preserve_workspace_creator',
);

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

assert(
  /^begin;\s*/i.test(legacyRlsSql) && /commit;\s*$/i.test(legacyRlsSql),
  'The legacy RLS optimization must be transactional.',
);
assert(
  createdLegacyPolicies.length === 18,
  'The legacy RLS optimization must recreate all 18 intended policies.',
);
assert(
  createdLegacyPolicies.every(({ sql }) => /\bto\s+authenticated\b/i.test(sql)),
  'Every recreated legacy RLS policy must be scoped to authenticated.',
);
assert(
  createdLegacyPolicies.every(({ name }) => droppedLegacyPolicyNames.has(name)),
  'Every recreated legacy RLS policy must first be dropped idempotently.',
);

const dropOnlyLegacyPolicies = [...droppedLegacyPolicyNames]
  .filter((name) => !createdLegacyPolicies.some((policy) => policy.name === name));

const expectedDropOnlyLegacyPolicies = new Set([
  'Authenticated users can create workspaces',
  'Service role has full access to licenses',
]);

assert(
  dropOnlyLegacyPolicies.length === expectedDropOnlyLegacyPolicies.size
    && dropOnlyLegacyPolicies.every((name) => expectedDropOnlyLegacyPolicies.has(name)),
  'Only the direct workspace INSERT and obsolete service-role policies may be removed.',
);
assert(
  !createdLegacyPolicies.some(({ name }) => name === 'Service role has full access to licenses'),
  'The obsolete service-role license policy must not be recreated.',
);

const withoutInitPlanAuthUid = legacyRlsSql.replace(
  /\(\s*select\s+auth\.uid\(\)\s*\)/gi,
  '',
);

assert(
  !/\bauth\.uid\(\)/i.test(withoutInitPlanAuthUid),
  'Legacy RLS policies must evaluate auth.uid() through an init-plan SELECT.',
);
assert(
  !/\bauth\.role\(\)/i.test(legacyRlsSql),
  'The legacy RLS migration must not restore an auth.role() service-role policy.',
);
assert(
  membershipHelperSql.length > 0,
  'The membership policy needs a private non-recursive authorization helper.',
);
assert(
  /security\s+definer/i.test(membershipHelperSql)
    && /set\s+search_path\s*=\s*''/i.test(membershipHelperSql),
  'The membership helper must bypass recursive RLS with an empty search path.',
);
assert(
  /revoke\s+all\s+on\s+function\s+hollow_private\.dawfi_can_add_workspace_member[\s\S]*?from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role\s*;/i
    .test(legacyRlsSql)
    && /grant\s+execute\s+on\s+function\s+hollow_private\.dawfi_can_add_workspace_member[\s\S]*?to\s+authenticated\s*;/i
      .test(legacyRlsSql),
  'The membership helper must be executable only by authenticated users.',
);
assert(
  membershipPolicy.includes('hollow_private.dawfi_can_add_workspace_member(')
    && !/from\s+public\.workspace_members/i.test(membershipPolicy),
  'The membership INSERT policy must not recursively query workspace_members.',
);
assert(
  /lower\(p_new_role\)\s+in\s*\('owner',\s*'admin',\s*'editor',\s*'viewer'\)/i
    .test(membershipHelperSql)
    && /wm\.user_id\s*=\s*v_actor_id/i.test(membershipHelperSql)
    && /lower\(coalesce\(wm\.role::text,\s*'viewer'\)\)\s+in\s*\('owner',\s*'admin'\)/i
      .test(membershipHelperSql)
    && !/from\s+public\.workspaces/i.test(membershipHelperSql),
  'The membership helper must allow only existing owners/admins and known roles.',
);
assert(
  createWorkspaceRpcSql.length > 0
    && /security\s+definer/i.test(createWorkspaceRpcSql)
    && /set\s+search_path\s*=\s*''/i.test(createWorkspaceRpcSql)
    && /v_user_id\s+uuid\s*:=\s*\(select\s+auth\.uid\(\)\)/i.test(createWorkspaceRpcSql)
    && /v_workspace_id\s+uuid\s*:=\s*pg_catalog\.gen_random_uuid\(\)/i.test(createWorkspaceRpcSql)
    && /insert\s+into\s+public\.workspaces/i.test(createWorkspaceRpcSql)
    && /insert\s+into\s+public\.workspace_members/i.test(createWorkspaceRpcSql),
  'Workspace creation must use one authenticated, atomic, empty-search-path definer RPC.',
);
assert(
  /revoke\s+all\s+on\s+function\s+public\.create_workspace_with_owner[\s\S]*?from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role\s*;/i
    .test(legacyRlsSql)
    && /grant\s+execute\s+on\s+function\s+public\.create_workspace_with_owner[\s\S]*?to\s+authenticated\s*;/i
      .test(legacyRlsSql),
  'The workspace creation RPC must be callable only by authenticated users.',
);
assert(
  !createdLegacyPolicies.some(({ name }) => name === 'Authenticated users can create workspaces')
    && /alter\s+table\s+public\.workspaces\s+enable\s+row\s+level\s+security/i.test(legacyRlsSql),
  'Direct authenticated workspace INSERT must stay disabled behind RLS.',
);
assert(
  preserveWorkspaceCreatorSql.length > 0
    && /returns\s+trigger/i.test(preserveWorkspaceCreatorSql)
    && /new\.created_by\s+is\s+distinct\s+from\s+old\.created_by/i
      .test(preserveWorkspaceCreatorSql)
    && /create\s+trigger\s+dawfi_preserve_workspace_creator[\s\S]*?before\s+update\s+of\s+created_by/i
      .test(legacyRlsSql),
  'Workspace created_by must be immutable so quota ownership cannot be reassigned.',
);
assert(
  createTeamModal.includes("supabase.rpc('create_workspace_with_owner'")
    && createTeamModal.includes("from '../lib/workspaceSlug'")
    && !createTeamModal.includes(".from('workspaces')")
    && !createTeamModal.includes(".from('workspace_members')")
    && workspaceSlug.includes('crypto.getRandomValues')
    && workspaceSlug.includes(".slice(0, WORKSPACE_SLUG_BASE_LIMIT)\n    .replace(/-+$/g, '')"),
  'Team creation must call the atomic RPC with a collision-resistant slug.',
);
assert(
  desktopHubVendor.includes("supabase.rpc('create_workspace_with_owner'")
    && desktopHubVendor.includes('crypto.getRandomValues')
    && desktopHubVendor.includes(".slice(0, 96)\n    .replace(/-+$/g, '')")
    && !desktopHubVendor.includes(".from('workspaces')\n        .insert")
    && !desktopHubVendor.includes(".from('workspace_members')\n        .insert")
    && !desktopHubVendor.includes('Math.random()'),
  'Vendored Desktop workspace creation must stay atomic and collision-resistant.',
);

for (const policyName of [
  'Users can update their own profile',
  'Owners and admins can update their workspaces',
  'Editors and above can update projects in their workspaces',
  'Users can update their own notifications',
]) {
  const statement = createdLegacyPolicies.find(({ name }) => name === policyName)?.sql ?? '';
  assert(
    /\bfor\s+update\b/i.test(statement)
      && /\busing\s*\(/i.test(statement)
      && /\bwith\s+check\s*\(/i.test(statement),
    `${policyName} must retain both USING and WITH CHECK predicates.`,
  );
}

console.log('Auth hardening contract passed.');

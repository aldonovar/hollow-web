// ============================================================
// Cloudflare Pages Function — Secure Upload URL Generator
// Hollow Bits Edge API
// Route: POST /api/storage/sign
// ============================================================
// Generates time-limited signed upload URLs for Supabase Storage.
// The frontend requests a signed URL → uploads directly to Storage
// from the browser → no file data transits through the Worker.
//
// Auth flow:
//   1. Frontend sends Supabase JWT in Authorization header
//   2. Worker verifies the JWT against Supabase
//   3. Worker generates a signed upload URL using the service key
//   4. Frontend uploads directly to the signed URL
// ============================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface SignRequest {
  /** Storage bucket name (e.g. "project-audio", "project-stems") */
  bucket: string;
  /** Object path within the bucket (e.g. "user-id/project-id/track-01.wav") */
  path: string;
  /** MIME type of the file being uploaded */
  contentType: string;
}

// ── Allowed buckets (whitelist) ────────────────────────────
const ALLOWED_BUCKETS = new Set([
  "project-audio",
  "project-stems",
  "project-exports",
  "user-avatars",
]);

// ── Max upload size per bucket (bytes) ─────────────────────
const BUCKET_SIZE_LIMITS: Record<string, number> = {
  "project-audio": 100 * 1024 * 1024,   // 100 MB
  "project-stems": 200 * 1024 * 1024,    // 200 MB
  "project-exports": 500 * 1024 * 1024,  // 500 MB
  "user-avatars": 5 * 1024 * 1024,       // 5 MB
};

// ── Verify Supabase JWT ────────────────────────────────────
async function verifySupabaseUser(
  env: Env,
  authHeader: string
): Promise<{ id: string; email: string } | null> {
  const token = authHeader.replace("Bearer ", "");

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const user = (await response.json()) as { id: string; email: string };
  return user;
}

// ── Main handler ───────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Authenticate the request
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = await verifySupabaseUser(env, authHeader);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parse and validate the request body
  let body: SignRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { bucket, path, contentType } = body;

  if (!bucket || !path || !contentType) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: bucket, path, contentType" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Validate bucket is allowed
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return new Response(
      JSON.stringify({ error: `Bucket "${bucket}" is not allowed` }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Ensure the path is scoped to the authenticated user
  if (!path.startsWith(`${user.id}/`)) {
    return new Response(
      JSON.stringify({ error: "Path must be scoped to your user ID" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Generate signed upload URL via Supabase Storage API
  try {
    const signResponse = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/upload/sign/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: 600, // 10 minutes
        }),
      }
    );

    if (!signResponse.ok) {
      const error = await signResponse.text();
      console.error("Supabase Storage sign error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate upload URL" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const signData = (await signResponse.json()) as { url: string };

    return new Response(
      JSON.stringify({
        signedUrl: `${env.SUPABASE_URL}/storage/v1${signData.url}`,
        expiresIn: 600,
        maxSize: BUCKET_SIZE_LIMITS[bucket] ?? 50 * 1024 * 1024,
        path: `${bucket}/${path}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("Storage signing error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error generating upload URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

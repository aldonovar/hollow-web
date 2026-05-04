// ============================================================
// Cloudflare Pages Function — Health Check Endpoint
// Hollow Bits Edge API
// Route: /api/health (GET)
// ============================================================
// This establishes the architectural pattern for all future
// Cloudflare Pages Functions (Stripe webhooks, signed uploads,
// edge-side auth validation, etc.)
//
// Cloudflare Pages Functions convention:
//   functions/api/health.ts  →  GET /api/health
//   Export named handlers: onRequestGet, onRequestPost, etc.
//   Or export a catch-all: onRequest
// ============================================================

interface Env {
  // Future bindings will be typed here:
  // SUPABASE_SERVICE_KEY: string;
  // STRIPE_WEBHOOK_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "Hollow Web Edge API",
      message: "Hollow Web Edge API is operational",
      timestamp: new Date().toISOString(),
      region: (context.request as any).cf?.colo ?? "unknown",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
};

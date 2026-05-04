// ============================================================
// Cloudflare Pages Function — Stripe Webhook Handler
// Hollow Bits Edge API
// Route: POST /api/webhooks/stripe
// ============================================================
// This function receives Stripe webhook events (e.g. checkout
// completed, subscription updated/cancelled) and updates the
// user's profile in Supabase using the service role key.
//
// The STRIPE_WEBHOOK_SECRET and SUPABASE_SERVICE_KEY are stored
// as encrypted environment variables in Cloudflare Pages settings,
// NEVER exposed to the frontend.
// ============================================================

interface Env {
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// ── Stripe signature verification ──────────────────────────
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  // Extract timestamp and signatures from Stripe header
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1Signature) return false;

  // Compute expected signature using Web Crypto API (Edge-compatible)
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedPayload = `${timestamp}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  // Convert to hex string for comparison
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === v1Signature;
}

// ── Supabase admin helper ──────────────────────────────────
async function supabaseAdmin(
  env: Env,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(options.headers ?? {}),
    },
  });
}

// ── Main handler ───────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Read raw body for signature verification
  const rawBody = await request.text();
  const stripeSignature = request.headers.get("stripe-signature");

  if (!stripeSignature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Verify webhook authenticity
  const isValid = await verifyStripeSignature(
    rawBody,
    stripeSignature,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse the verified event
  const event = JSON.parse(rawBody);

  // 4. Route by event type
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Update profile: tier + Stripe link
        await supabaseAdmin(env, `profiles?id=eq.${userId}`, {
          method: "PATCH",
          body: JSON.stringify({
            tier: "pro",
            stripe_customer_id: session.customer,
            subscription_status: "active",
          }),
        });

        // Upsert license record
        await supabaseAdmin(env, "licenses", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({
            user_id: userId,
            tier: "pro",
            status: "active",
            current_period_end: null,
          }),
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const periodEnd = new Date(
          subscription.current_period_end * 1000
        ).toISOString();

        // Sync profile status
        await supabaseAdmin(
          env,
          `profiles?stripe_customer_id=eq.${customerId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              subscription_status: subscription.status,
            }),
          }
        );

        // Sync license record via user lookup
        const profileRes = await supabaseAdmin(
          env,
          `profiles?stripe_customer_id=eq.${customerId}&select=id`,
          { method: "GET", headers: { Accept: "application/json" } }
        );
        const profiles = (await profileRes.json()) as { id: string }[];
        if (profiles.length > 0) {
          await supabaseAdmin(
            env,
            `licenses?user_id=eq.${profiles[0].id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                status: subscription.status,
                current_period_end: periodEnd,
              }),
            }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Downgrade profile
        await supabaseAdmin(
          env,
          `profiles?stripe_customer_id=eq.${customerId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              tier: "free",
              subscription_status: "cancelled",
            }),
          }
        );

        // Downgrade license
        const profileRes2 = await supabaseAdmin(
          env,
          `profiles?stripe_customer_id=eq.${customerId}&select=id`,
          { method: "GET", headers: { Accept: "application/json" } }
        );
        const profiles2 = (await profileRes2.json()) as { id: string }[];
        if (profiles2.length > 0) {
          await supabaseAdmin(
            env,
            `licenses?user_id=eq.${profiles2[0].id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                tier: "free",
                status: "canceled",
                current_period_end: null,
              }),
            }
          );
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal processing error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

import Stripe from "stripe";

// Import this module only from server route handlers.
// The fetch-based HTTP client is used (instead of stripe-node's default
// raw-https client) so requests honour the environment's HTTP(S)_PROXY:
// from this VM, direct TLS to api.stripe.com is blocked by the egress
// proxy and only fetch (Node 24, NODE_USE_ENV_PROXY) gets through.
// On Vercel there is no proxy env, so fetch goes direct — same behaviour.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null;
}

export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

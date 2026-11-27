// T-3.1 webhook acceptance test: locally-sign a checkout.session.completed
// payload with the stored STRIPE_WEBHOOK_SECRET and POST it to the webhook
// endpoint. Usage:
//   node scripts/test-stripe-webhook.mjs <webhook-url> <user-id> [customer-id]
// Prints the HTTP status and the user's plan afterwards (queried via Neon).
// The secret is read from Doppler and never printed.
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

const [url, userId, customerId = "cus_test_t31webhook"] = process.argv.slice(2);
if (!url || !userId) {
  console.error("Usage: node scripts/test-stripe-webhook.mjs <webhook-url> <user-id> [customer-id]");
  process.exit(2);
}

const dopplerOut = execFileSync("python3",
  ["/home/hatch/workspace/custom-connectors/custom.doppler/bin/doppler.py", "get",
   "--project", "muse", "--config", "dev", "STRIPE_WEBHOOK_SECRET"],
  { encoding: "utf8" });
const secret = JSON.parse(dopplerOut).value.raw;

const payload = JSON.stringify({
  id: `evt_test_${Date.now()}`,
  type: "checkout.session.completed",
  data: { object: { id: "cs_test_t31", client_reference_id: userId, customer: customerId } },
});
const t = Math.floor(Date.now() / 1000);
const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
const sig = `t=${t},v1=${v1}`;

const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": sig },
  body: payload,
});
console.log(`POST ${url} -> ${res.status} ${await res.text()}`);

// Bad-signature check: same payload, wrong secret.
const badV1 = createHmac("sha256", "whsec_wrong").update(`${t}.${payload}`).digest("hex");
const bad = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${badV1}` },
  body: payload,
});
console.log(`bad signature -> ${bad.status} ${await bad.text()}`);

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const databaseUrl = envFile.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(databaseUrl);
const [row] = await sql.query(
  "SELECT plan, stripe_customer_id FROM users WHERE id = $1", [userId]);
console.log("user row:", row ?? "(not found)");

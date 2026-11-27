import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const secret = JSON.parse(execFileSync("python3",["/home/hatch/workspace/custom-connectors/custom.doppler/bin/doppler.py","get","--project","muse","--config","dev","STRIPE_WEBHOOK_SECRET"],{encoding:"utf8"})).value.raw;
const payload = JSON.stringify({ id: `evt_test_del_${Date.now()}`, type: "customer.subscription.deleted",
  data: { object: { id: "sub_test_t31", customer: "cus_test_t31webhook" } } });
const t = Math.floor(Date.now()/1000);
const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
const res = await fetch("http://localhost:3100/api/stripe/webhook", { method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${v1}` }, body: payload });
console.log("deleted event ->", res.status, await res.text());
const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local","utf8");
const sql = neon(envFile.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g,""));
const [row] = await sql.query("SELECT plan, stripe_customer_id FROM users WHERE id = $1", ["d66dda7e-1249-4f52-aedf-da105c2c1c42"]);
console.log("user row:", row);

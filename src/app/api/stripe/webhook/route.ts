import { and, eq, ne, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const secret = getWebhookSecret();
  const stripe = getStripe();
  if (!secret || !stripe) {
    console.error("Stripe webhook billing configuration is missing.");
    return Response.json({ error: "Billing is not configured yet. Please try again later." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    console.warn("Stripe webhook signature verification failed.");
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customerId) {
      console.warn("Stripe Checkout Session has no customer.", event.id);
      return Response.json({ received: true });
    }

    const referenceId = session.client_reference_id;
    const selection = { id: users.id, plan: users.plan, stripeCustomerId: users.stripeCustomerId };
    let user: { id: string; plan: "solo" | "team"; stripeCustomerId: string | null } | undefined;
    if (referenceId && USER_ID_PATTERN.test(referenceId)) {
      [user] = await db.select(selection).from(users).where(eq(users.id, referenceId)).limit(1);
    }
    if (!user) {
      [user] = await db.select(selection).from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    }

    if (!user) {
      console.warn("No user matched the Stripe Checkout Session.", event.id);
    } else if (user.plan !== "team" || user.stripeCustomerId !== customerId) {
      await db.update(users).set({ plan: "team", stripeCustomerId: customerId }).where(and(
        eq(users.id, user.id),
        or(ne(users.plan, "team"), sql`${users.stripeCustomerId} is distinct from ${customerId}`),
      ));
    }
  } else if (event.type === "customer.subscription.deleted") {
    const customer = event.data.object.customer;
    const customerId = typeof customer === "string" ? customer : customer.id;
    await db.update(users).set({ plan: "solo" }).where(and(
      eq(users.stripeCustomerId, customerId),
      ne(users.plan, "solo"),
    ));
  }

  return Response.json({ received: true });
}

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSessionUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

const DEFAULT_ORIGIN = "https://agent-done-checker.vercel.app";

function checkoutOrigin(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin;
  } catch {
    // Use the public origin if the request has no usable URL.
  }
  return DEFAULT_ORIGIN;
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Sign in with GitHub to upgrade to Team." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Billing is not configured yet. Please try again later." }, { status: 503 });
  }

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    stripeCustomerId: users.stripeCustomerId,
    plan: users.plan,
  }).from(users).where(eq(users.id, sessionUser.id)).limit(1);

  if (!user) {
    return Response.json({ error: "Your account could not be found. Please sign in again." }, { status: 404 });
  }

  const origin = checkoutOrigin(request.url);
  if (user.plan === "team") {
    return Response.json({ url: `${origin}/checks`, alreadyTeam: true });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      }, { idempotencyKey: `adc-customer-${user.id}` });
      customerId = customer.id;
    } catch (error) {
      console.error("Could not create Stripe customer.", error);
      return Response.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
    }

    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Agent Done Checker — Team" },
          recurring: { interval: "month" },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      customer: customerId,
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/checks?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    if (!session.url) {
      return Response.json({ error: "Checkout is temporarily unavailable. Please try again." }, { status: 502 });
    }
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe Checkout Session.", error);
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}

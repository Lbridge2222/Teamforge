import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Plan } from "@/lib/types";

// POST /api/billing/webhook — Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 501 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.orgId;
        const plan = session.metadata?.plan as Plan | undefined;

        if (orgId && plan) {
          await db
            .update(organisations)
            .set({
              plan,
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.toString(),
              updatedAt: new Date(),
            })
            .where(eq(organisations.id, orgId));
          console.log(`✅ Upgraded org ${orgId} to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.toString();

        if (customerId) {
          const org = await db.query.organisations.findFirst({
            where: eq(organisations.stripeCustomerId, customerId),
          });

          if (org && subscription.status === "active") {
            // Plan is set from checkout metadata, but we could also
            // derive from price IDs if needed
            console.log(`✅ Subscription updated for org ${org.id}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.toString();

        if (customerId) {
          const org = await db.query.organisations.findFirst({
            where: eq(organisations.stripeCustomerId, customerId),
          });

          if (org) {
            await db
              .update(organisations)
              .set({ plan: "free", updatedAt: new Date() })
              .where(eq(organisations.id, org.id));
            console.log(`⬇️ Downgraded org ${org.id} to free`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

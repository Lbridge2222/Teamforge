import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orgMembers, organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/billing/checkout — create Stripe Checkout session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, annual } = await request.json();

    if (!plan || !["starter", "pro"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be starter or pro" },
        { status: 400 }
      );
    }

    // Verify user is org owner
    const membership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only organisation owners can manage billing" },
        { status: 403 }
      );
    }

    const org = await db.query.organisations.findFirst({
      where: eq(organisations.id, membership.orgId),
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY, STRIPE_STARTER_MONTHLY_PRICE_ID, STRIPE_STARTER_ANNUAL_PRICE_ID, STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_ANNUAL_PRICE_ID in your environment.",
        },
        { status: 501 }
      );
    }

    // Dynamic import to avoid build errors when stripe isn't installed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    // Get or create Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: org.name,
        metadata: { orgId: org.id },
      });
      customerId = customer.id;
      await db
        .update(organisations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organisations.id, org.id));
    }

    // Map plan + interval to price IDs
    const priceIds: Record<string, string | undefined> = {
      starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
      pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    };

    const priceKey = `${plan}_${annual ? "annual" : "monthly"}`;
    const priceId = priceIds[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${priceKey}` },
        { status: 501 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/org/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/org/billing`,
      metadata: { orgId: org.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

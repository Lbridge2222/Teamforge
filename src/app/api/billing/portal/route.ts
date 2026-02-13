import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orgMembers, organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/billing/portal — create Stripe Customer Portal session
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Upgrade first." },
        { status: 404 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 501 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${siteUrl}/org/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}

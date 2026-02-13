import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organisations, orgMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// POST /api/org/setup — create organisation on first signup
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgName } = await request.json();

    if (!orgName) {
      return NextResponse.json(
        { error: "orgName is required" },
        { status: 400 }
      );
    }

    const existing = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Organisation already exists for this user" },
        { status: 409 }
      );
    }

    // Generate slug from org name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    // Create organisation
    const [org] = await db
      .insert(organisations)
      .values({
        name: orgName,
        slug: `${slug}-${Date.now().toString(36)}`,
        plan: "free",
      })
      .returning();

    // Create owner membership
    await db.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: "owner",
      acceptedAt: new Date(),
    });

    return NextResponse.json({ org });
  } catch (error) {
    console.error("Org setup error:", error);
    return NextResponse.json(
      { error: "Failed to create organisation" },
      { status: 500 }
    );
  }
}

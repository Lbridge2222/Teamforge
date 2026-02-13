import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organisations, orgMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

// GET /api/org — get current user's organisation
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find membership for this user
    const membership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No organisation found" }, { status: 404 });
    }

    const org = await db.query.organisations.findFirst({
      where: eq(organisations.id, membership.orgId),
    });

    return NextResponse.json({ org, membership });
  } catch (error) {
    console.error("Get org error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organisation" },
      { status: 500 }
    );
  }
}

// PUT /api/org — update organisation name
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    // Find user's membership — must be owner or admin
    const membership = await db.query.orgMembers.findFirst({
      where: and(
        eq(orgMembers.userId, user.id),
      ),
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(organisations)
      .set({ name, updatedAt: new Date() })
      .where(eq(organisations.id, membership.orgId))
      .returning();

    return NextResponse.json({ org: updated });
  } catch (error) {
    console.error("Update org error:", error);
    return NextResponse.json(
      { error: "Failed to update organisation" },
      { status: 500 }
    );
  }
}

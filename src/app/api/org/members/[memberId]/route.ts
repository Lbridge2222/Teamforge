import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ memberId: string }> };

// PUT /api/org/members/[memberId] — update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await request.json();

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Find user's membership — must be owner or admin
    const myMembership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't change own role
    const targetMember = await db.query.orgMembers.findFirst({
      where: and(
        eq(orgMembers.id, memberId),
        eq(orgMembers.orgId, myMembership.orgId)
      ),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(orgMembers)
      .set({ role: role as "admin" | "editor" | "viewer" })
      .where(eq(orgMembers.id, memberId))
      .returning();

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/org/members/[memberId] — remove member or cancel invite
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myMembership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetMember = await db.query.orgMembers.findFirst({
      where: and(
        eq(orgMembers.id, memberId),
        eq(orgMembers.orgId, myMembership.orgId)
      ),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove the owner
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organisation owner" },
        { status: 403 }
      );
    }

    await db.delete(orgMembers).where(eq(orgMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

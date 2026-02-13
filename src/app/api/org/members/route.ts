import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgMembers, organisations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// GET /api/org/members — list all org members
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's org membership
    const membership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No organisation found" }, { status: 404 });
    }

    // Get all members for this org
    const members = await db
      .select()
      .from(orgMembers)
      .where(eq(orgMembers.orgId, membership.orgId))
      .orderBy(orgMembers.createdAt);

    // Look up emails from Supabase auth for accepted members
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        if (m.invitedEmail && !m.acceptedAt) {
          return { ...m, email: m.invitedEmail, name: null };
        }
        // For accepted members, look up from Supabase admin
        if (!admin) {
          return { ...m, email: m.invitedEmail ?? "Unknown", name: null };
        }

        const {
          data: { user: memberUser },
        } = await admin.auth.admin.getUserById(m.userId);
        return {
          ...m,
          email: memberUser?.email ?? m.invitedEmail ?? "Unknown",
          name: memberUser?.user_metadata?.full_name ?? null,
        };
      })
    );

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error("Get members error:", error);
    // If admin API fails (no service key), return basic members
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const membership = await db.query.orgMembers.findFirst({
        where: eq(orgMembers.userId, user.id),
      });
      if (!membership) throw new Error("No org");

      const members = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.orgId, membership.orgId))
        .orderBy(orgMembers.createdAt);

      return NextResponse.json({
        members: members.map((m) => ({
          ...m,
          email: m.invitedEmail ?? "User",
          name: null,
        })),
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }
  }
}

// POST /api/org/members — invite a new member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Find user's org membership — must be owner or admin
    const membership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user.id),
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check plan limits
    const org = await db.query.organisations.findFirst({
      where: eq(organisations.id, membership.orgId),
    });
    if (!org) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    const { PLAN_LIMITS } = await import("@/lib/types");
    const limits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS];
    const currentMembers = await db
      .select()
      .from(orgMembers)
      .where(eq(orgMembers.orgId, membership.orgId));

    if (currentMembers.length >= limits.orgMembers) {
      return NextResponse.json(
        {
          error: `Member limit reached (${limits.orgMembers} on ${org.plan} plan). Upgrade to add more members.`,
        },
        { status: 403 }
      );
    }

    // Check if already invited
    const existing = await db.query.orgMembers.findFirst({
      where: and(
        eq(orgMembers.orgId, membership.orgId),
        eq(orgMembers.invitedEmail, email)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email has already been invited" },
        { status: 409 }
      );
    }

    // Create pending invite
    const [invite] = await db
      .insert(orgMembers)
      .values({
        orgId: membership.orgId,
        userId: "00000000-0000-0000-0000-000000000000", // Placeholder until they accept
        role: role as "admin" | "editor" | "viewer",
        invitedEmail: email,
      })
      .returning();

    return NextResponse.json({ member: invite }, { status: 201 });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}

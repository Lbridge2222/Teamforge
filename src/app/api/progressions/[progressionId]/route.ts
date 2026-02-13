import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roleProgressions, teamRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

type RouteParams = { params: Promise<{ progressionId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { progressionId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const progression = await db.query.roleProgressions.findFirst({
      where: eq(roleProgressions.id, progressionId),
    });

    if (!progression) {
      return NextResponse.json(
        { error: "Progression not found" },
        { status: 404 }
      );
    }

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, progression.roleId),
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const access = await requireWorkspaceAccess(
      role.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const updates = await request.json();
    const {
      id: _id,
      roleId: _roleId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeUpdates
    } = updates ?? {};
    const [updated] = await db
      .update(roleProgressions)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(roleProgressions.id, progressionId))
      .returning();
    return NextResponse.json({ progression: updated });
  } catch (error) {
    console.error("Update progression error:", error);
    return NextResponse.json({ error: "Failed to update progression" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { progressionId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const progression = await db.query.roleProgressions.findFirst({
      where: eq(roleProgressions.id, progressionId),
    });

    if (!progression) {
      return NextResponse.json(
        { error: "Progression not found" },
        { status: 404 }
      );
    }

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, progression.roleId),
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const access = await requireWorkspaceAccess(
      role.workspaceId,
      auth.user.id,
      "admin"
    );
    if ("response" in access) return access.response!;

    await db.delete(roleProgressions).where(eq(roleProgressions.id, progressionId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete progression error:", error);
    return NextResponse.json({ error: "Failed to delete progression" }, { status: 500 });
  }
}

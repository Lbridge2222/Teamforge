import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

type RouteParams = { params: Promise<{ roleId: string }> };

// PUT /api/roles/:roleId
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { roleId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
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
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeUpdates
    } = updates ?? {};
    const [updated] = await db
      .update(teamRoles)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(teamRoles.id, roleId))
      .returning();
    return NextResponse.json({ role: updated });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

// DELETE /api/roles/:roleId
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { roleId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
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

    await db.delete(teamRoles).where(eq(teamRoles.id, roleId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}

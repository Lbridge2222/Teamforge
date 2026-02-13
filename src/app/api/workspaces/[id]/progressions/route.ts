import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roleProgressions, teamRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/progressions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(
      workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const body = await request.json();
    if (!body?.roleId) {
      return NextResponse.json(
        { error: "roleId is required" },
        { status: 400 }
      );
    }

    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeBody
    } = body ?? {};

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, safeBody.roleId),
    });

    if (!role || role.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Role not found in this workspace" },
        { status: 404 }
      );
    }

    const [progression] = await db
      .insert(roleProgressions)
      .values(safeBody)
      .returning();
    return NextResponse.json({ progression });
  } catch (error) {
    console.error("Create progression error:", error);
    return NextResponse.json({ error: "Failed to create progression" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/roles
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
    const {
      id: _id,
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeBody
    } = body ?? {};
    const [role] = await db
      .insert(teamRoles)
      .values({ ...safeBody, workspaceId })
      .returning();
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}

// GET /api/workspaces/:id/roles
export async function GET(
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
      "viewer"
    );
    if ("response" in access) return access.response!;

    const results = await db.query.teamRoles.findMany({
      where: eq(teamRoles.workspaceId, workspaceId),
    });
    return NextResponse.json({ roles: results });
  } catch (error) {
    console.error("List roles error:", error);
    return NextResponse.json({ error: "Failed to list roles" }, { status: 500 });
  }
}

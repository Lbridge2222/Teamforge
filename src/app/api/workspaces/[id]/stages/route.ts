import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/stages
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
    const [stage] = await db
      .insert(stages)
      .values({ ...safeBody, workspaceId })
      .returning();

    return NextResponse.json({ stage });
  } catch (error) {
    console.error("Create stage error:", error);
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}

// GET /api/workspaces/:id/stages
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

    const results = await db.query.stages.findMany({
      where: eq(stages.workspaceId, workspaceId),
      orderBy: (s, { asc }) => [asc(s.sortOrder)],
    });
    return NextResponse.json({ stages: results });
  } catch (error) {
    console.error("List stages error:", error);
    return NextResponse.json({ error: "Failed to list stages" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

type RouteParams = { params: Promise<{ stageId: string }> };

// PUT /api/stages/:stageId
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { stageId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const stage = await db.query.stages.findFirst({
      where: eq(stages.id, stageId),
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const access = await requireWorkspaceAccess(
      stage.workspaceId,
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
      .update(stages)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(stages.id, stageId))
      .returning();
    return NextResponse.json({ stage: updated });
  } catch (error) {
    console.error("Update stage error:", error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}

// DELETE /api/stages/:stageId
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { stageId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const stage = await db.query.stages.findFirst({
      where: eq(stages.id, stageId),
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const access = await requireWorkspaceAccess(
      stage.workspaceId,
      auth.user.id,
      "admin"
    );
    if ("response" in access) return access.response!;

    await db.delete(stages).where(eq(stages.id, stageId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete stage error:", error);
    return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 });
  }
}

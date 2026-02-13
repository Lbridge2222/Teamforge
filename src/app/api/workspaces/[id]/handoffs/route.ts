import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handoffs, stages } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/handoffs
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

    if (!safeBody?.fromStageId || !safeBody?.toStageId) {
      return NextResponse.json(
        { error: "fromStageId and toStageId are required" },
        { status: 400 }
      );
    }

    const stageList = await db.query.stages.findMany({
      where: inArray(stages.id, [safeBody.fromStageId, safeBody.toStageId]),
    });

    const validStages =
      stageList.length === 2 &&
      stageList.every((stage) => stage.workspaceId === workspaceId);

    if (!validStages) {
      return NextResponse.json(
        { error: "Stages not found in this workspace" },
        { status: 400 }
      );
    }

    const [handoff] = await db
      .insert(handoffs)
      .values({ ...safeBody, workspaceId })
      .returning();
    return NextResponse.json({ handoff });
  } catch (error) {
    console.error("Create handoff error:", error);
    return NextResponse.json({ error: "Failed to create handoff" }, { status: 500 });
  }
}

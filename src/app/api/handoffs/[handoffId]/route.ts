import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handoffs, stages } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

type RouteParams = { params: Promise<{ handoffId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { handoffId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const handoff = await db.query.handoffs.findFirst({
      where: eq(handoffs.id, handoffId),
    });

    if (!handoff) {
      return NextResponse.json(
        { error: "Handoff not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      handoff.workspaceId,
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

    if (safeUpdates?.fromStageId || safeUpdates?.toStageId) {
      const fromStageId =
        safeUpdates.fromStageId ?? handoff.fromStageId;
      const toStageId = safeUpdates.toStageId ?? handoff.toStageId;

      const stageList = await db.query.stages.findMany({
        where: inArray(stages.id, [fromStageId, toStageId]),
      });

      const validStages =
        stageList.length === 2 &&
        stageList.every((stage) => stage.workspaceId === handoff.workspaceId);

      if (!validStages) {
        return NextResponse.json(
          { error: "Stages not found in this workspace" },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(handoffs)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(handoffs.id, handoffId))
      .returning();
    return NextResponse.json({ handoff: updated });
  } catch (error) {
    console.error("Update handoff error:", error);
    return NextResponse.json({ error: "Failed to update handoff" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { handoffId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const handoff = await db.query.handoffs.findFirst({
      where: eq(handoffs.id, handoffId),
    });

    if (!handoff) {
      return NextResponse.json(
        { error: "Handoff not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      handoff.workspaceId,
      auth.user.id,
      "admin"
    );
    if ("response" in access) return access.response!;

    await db.delete(handoffs).where(eq(handoffs.id, handoffId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete handoff error:", error);
    return NextResponse.json({ error: "Failed to delete handoff" }, { status: 500 });
  }
}

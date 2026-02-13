// ════════════════════════════════════════════
// POST /api/workspaces/[id]/clarity/detect-overlaps
// AI-powered workspace-wide overlap detection
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  teamRoles,
  stages,
  handoffs,
  stageRoleAssignments,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { detectWorkspaceOverlaps } from "@/lib/clarity/overlaps";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(
    workspaceId,
    auth.user.id,
    "editor"
  );
  if ("response" in access) return access.response;

  const [wsRoles, wsStages, wsHandoffs] = await Promise.all([
    db.select().from(teamRoles).where(eq(teamRoles.workspaceId, workspaceId)),
    db.select().from(stages).where(eq(stages.workspaceId, workspaceId)),
    db.select().from(handoffs).where(eq(handoffs.workspaceId, workspaceId)),
  ]);

  const stageIds = wsStages.map((s) => s.id);
  const wsStageAssignments =
    stageIds.length > 0
      ? await db
          .select()
          .from(stageRoleAssignments)
          .where(inArray(stageRoleAssignments.stageId, stageIds))
      : [];

  if (wsRoles.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 roles to detect overlaps" },
      { status: 400 }
    );
  }

  try {
    const result = await detectWorkspaceOverlaps({
      roles: wsRoles,
      stages: wsStages,
      handoffs: wsHandoffs,
      stageAssignments: wsStageAssignments,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Overlap detection failed",
        details:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

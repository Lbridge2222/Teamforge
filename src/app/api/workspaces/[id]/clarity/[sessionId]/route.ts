// ════════════════════════════════════════════
// GET /api/workspaces/[id]/clarity/[sessionId]
// Get a single clarity session with proposals and comments
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  claritySessions,
  clarityProposals,
  clarityComments,
  teamRoles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: workspaceId, sessionId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(workspaceId, auth.user.id);
  if ("response" in access) return access.response;

  const [session] = await db
    .select()
    .from(claritySessions)
    .where(
      and(
        eq(claritySessions.id, sessionId),
        eq(claritySessions.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  const [proposals, comments] = await Promise.all([
    db
      .select()
      .from(clarityProposals)
      .where(eq(clarityProposals.sessionId, sessionId)),
    db
      .select()
      .from(clarityComments)
      .where(eq(clarityComments.sessionId, sessionId)),
  ]);

  const role = session.roleId
    ? (
        await db
          .select()
          .from(teamRoles)
          .where(eq(teamRoles.id, session.roleId))
          .limit(1)
      )[0] ?? null
    : null;

  return NextResponse.json({
    ...session,
    proposals,
    comments,
    role,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: workspaceId, sessionId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(
    workspaceId,
    auth.user.id,
    "editor"
  );
  if ("response" in access) return access.response;

  await db
    .delete(claritySessions)
    .where(
      and(
        eq(claritySessions.id, sessionId),
        eq(claritySessions.workspaceId, workspaceId)
      )
    );

  return NextResponse.json({ success: true });
}

// ════════════════════════════════════════════
// POST /api/workspaces/[id]/clarity/[sessionId]/proposals/[proposalId]/apply
// Apply a single proposal — update the model with explicit user confirmation
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clarityProposals,
  claritySessions,
  teamRoles,
  handoffs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      sessionId: string;
      proposalId: string;
    }>;
  }
) {
  const { id: workspaceId, sessionId, proposalId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(
    workspaceId,
    auth.user.id,
    "editor"
  );
  if ("response" in access) return access.response;

  // Verify session belongs to workspace
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

  // Load proposal
  const [proposal] = await db
    .select()
    .from(clarityProposals)
    .where(
      and(
        eq(clarityProposals.id, proposalId),
        eq(clarityProposals.sessionId, sessionId)
      )
    )
    .limit(1);

  if (!proposal) {
    return NextResponse.json(
      { error: "Proposal not found" },
      { status: 404 }
    );
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: `Proposal already ${proposal.status}` },
      { status: 400 }
    );
  }

  // Apply the change to the model
  try {
    if (proposal.targetRoleId && proposal.field) {
      // Role field update
      const updateData: Record<string, unknown> = {
        [proposal.field]: proposal.proposedValue,
        updatedAt: new Date(),
      };

      await db
        .update(teamRoles)
        .set(updateData)
        .where(eq(teamRoles.id, proposal.targetRoleId));
    } else if (proposal.targetHandoffId && proposal.field) {
      // Handoff field update
      const updateData: Record<string, unknown> = {
        [proposal.field]: proposal.proposedValue,
        updatedAt: new Date(),
      };

      await db
        .update(handoffs)
        .set(updateData)
        .where(eq(handoffs.id, proposal.targetHandoffId));
    }

    // Mark proposal as accepted
    await db
      .update(clarityProposals)
      .set({
        status: "accepted",
        resolvedBy: auth.user.id,
        resolvedAt: new Date(),
      })
      .where(eq(clarityProposals.id, proposalId));

    return NextResponse.json({ success: true, status: "accepted" });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to apply proposal",
        details:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

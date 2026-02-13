// ════════════════════════════════════════════
// POST /api/workspaces/[id]/clarity/[sessionId]/comments
// Add a comment or approval to a clarity session/proposal
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clarityComments, claritySessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { createClarityCommentSchema } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: workspaceId, sessionId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(workspaceId, auth.user.id);
  if ("response" in access) return access.response;

  // Verify session
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createClarityCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [comment] = await db
    .insert(clarityComments)
    .values({
      sessionId,
      proposalId: parsed.data.proposalId ?? null,
      userId: auth.user.id,
      userEmail: auth.user.email ?? null,
      content: parsed.data.content,
      isApproval: parsed.data.isApproval,
    })
    .returning();

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id: workspaceId, sessionId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(workspaceId, auth.user.id);
  if ("response" in access) return access.response;

  const comments = await db
    .select()
    .from(clarityComments)
    .where(eq(clarityComments.sessionId, sessionId));

  return NextResponse.json(comments);
}

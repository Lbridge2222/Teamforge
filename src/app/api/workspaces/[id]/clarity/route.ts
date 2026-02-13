// ════════════════════════════════════════════
// GET/POST /api/workspaces/[id]/clarity
// List sessions or create a new clarity session
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  claritySessions,
  clarityProposals,
  clarityComments,
  teamRoles,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { extractRoleExpectations } from "@/lib/clarity/extract";
import { createClaritySessionSchema } from "@/lib/validation/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const access = await requireWorkspaceAccess(workspaceId, auth.user.id);
  if ("response" in access) return access.response;

  const sessions = await db
    .select()
    .from(claritySessions)
    .where(eq(claritySessions.workspaceId, workspaceId))
    .orderBy(desc(claritySessions.createdAt));

  // Enrich with role info
  const roleIds = [
    ...new Set(sessions.map((s) => s.roleId).filter(Boolean) as string[]),
  ];
  const roles =
    roleIds.length > 0
      ? await db.select().from(teamRoles).where(
          eq(teamRoles.workspaceId, workspaceId)
        )
      : [];

  const enriched = sessions.map((s) => ({
    ...s,
    role: roles.find((r) => r.id === s.roleId) ?? null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createClaritySessionSchema.safeParse({
    ...body as Record<string, unknown>,
    workspaceId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { inputType, inputText, inputUrl, roleId } = parsed.data;

  // Extract role expectations via AI if we have input
  let extractedData: Record<string, unknown> = {};
  if (inputType !== "manual" && (inputText || inputUrl)) {
    try {
      const extracted = await extractRoleExpectations({
        text: inputText,
        url: inputUrl,
      });
      extractedData = {
        extractedTitle: extracted.title,
        extractedPurpose: extracted.purpose,
        extractedResponsibilities: extracted.responsibilities,
        extractedDeliverables: extracted.deliverables,
        extractedOwnershipDomains: extracted.ownershipDomains,
        extractedDoesNotOwn: extracted.doesNotOwn,
        extractedContributesTo: extracted.contributesTo,
        extractedSkills: extracted.skills,
        extractedTier: extracted.suggestedTier,
        extractedAutonomyLevel: extracted.autonomyLevel,
        extractedSpanOfInfluence: extracted.spanOfInfluence,
        extractedAmbiguities: extracted.ambiguities,
        extractedRedFlags: extracted.redFlags,
      };
    } catch (err) {
      return NextResponse.json(
        {
          error: "AI extraction failed",
          details:
            err instanceof Error ? err.message : "Unknown error",
        },
        { status: 422 }
      );
    }
  }

  const [session] = await db
    .insert(claritySessions)
    .values({
      workspaceId,
      userId: auth.user.id,
      roleId: roleId ?? null,
      inputType,
      inputText: inputText ?? null,
      inputUrl: inputUrl ?? null,
      status: inputType === "manual" ? "draft" : "analyzing",
      ...extractedData,
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}

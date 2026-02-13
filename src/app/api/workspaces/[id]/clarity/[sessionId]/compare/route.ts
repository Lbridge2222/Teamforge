// ════════════════════════════════════════════
// POST /api/workspaces/[id]/clarity/[sessionId]/compare
// Run AI comparison: expected vs current role → generate proposals
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  claritySessions,
  clarityProposals,
  teamRoles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { compareRoleExpectations } from "@/lib/clarity/compare";
import { generateProposals } from "@/lib/clarity/proposals";
import { compareClaritySessionSchema } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = compareClaritySessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roleId } = parsed.data;

  // Load session
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

  // Must have extracted data
  if (
    !session.extractedTitle &&
    !session.extractedResponsibilities?.length
  ) {
    return NextResponse.json(
      { error: "Session has no extracted data to compare" },
      { status: 400 }
    );
  }

  // Load the target role and all workspace roles
  const allRoles = await db
    .select()
    .from(teamRoles)
    .where(eq(teamRoles.workspaceId, workspaceId));

  const currentRole = allRoles.find((r) => r.id === roleId);
  if (!currentRole) {
    return NextResponse.json(
      { error: "Role not found in workspace" },
      { status: 404 }
    );
  }

  // Update session with the linked role
  await db
    .update(claritySessions)
    .set({ roleId, status: "analyzing" })
    .where(eq(claritySessions.id, sessionId));

  try {
    // Step 1: Run comparison
    const rawResponsibilities = (session.extractedResponsibilities as unknown[]) ?? [];
    const rawDeliverables = (session.extractedDeliverables as unknown[]) ?? [];
    const rawSkills = (session.extractedSkills as unknown[]) ?? [];

    const extracted = {
      title: session.extractedTitle ?? "",
      purpose: session.extractedPurpose ?? "",
      responsibilities: rawResponsibilities.map((r) =>
        typeof r === "string" ? r : (r as { text: string }).text
      ),
      deliverables: rawDeliverables.map((d) =>
        typeof d === "string" ? d : (d as { text: string }).text
      ),
      ownershipDomains:
        (session.extractedOwnershipDomains as {
          title: string;
          items: string[];
        }[]) ?? [],
      doesNotOwn: (session.extractedDoesNotOwn as string[]) ?? [],
      skills: rawSkills.map((s) =>
        typeof s === "string" ? s : (s as { text: string }).text
      ),
      suggestedTier: session.extractedTier,
    };

    const comparison = await compareRoleExpectations({
      extracted,
      currentRole,
      allRoles,
    });

    // Map gaps to include explanation (backward compat with DB schema)
    const mappedGaps = comparison.gaps.map((g) => ({
      ...g,
      explanation: g.riskStatement,
    }));

    // Step 2: Generate proposals from the comparison
    const { proposals, implementationPlan } = await generateProposals({
      currentRole,
      gaps: mappedGaps,
      overlaps: comparison.overlaps,
      extracted,
    });

    // Step 3: Save comparison results to session
    await db
      .update(claritySessions)
      .set({
        comparisonSummary: comparison.summary,
        gapAnalysis: mappedGaps,
        overlapAnalysis: comparison.overlaps,
        status: "compared",
        updatedAt: new Date(),
      })
      .where(eq(claritySessions.id, sessionId));

    // Step 4: Save proposals to DB
    if (proposals.length > 0) {
      await db.insert(clarityProposals).values(
        proposals.map((p) => ({
          sessionId,
          type: p.type,
          targetRoleId: roleId,
          field: p.field,
          currentValue: p.currentValue,
          proposedValue: p.proposedValue,
          title: p.title,
          explanation: p.explanation,
          impact: p.impact,
          metadata: {
            effort: p.effort,
            confidence: p.confidence,
            sequenceGroup: p.sequenceGroup,
            reversible: p.reversible,
            requiresConversation: p.requiresConversation,
            affectedRoles: p.affectedRoles,
            doNothingCost: p.doNothingCost,
          },
        }))
      );
    }

    // Load the saved proposals
    const savedProposals = await db
      .select()
      .from(clarityProposals)
      .where(eq(clarityProposals.sessionId, sessionId));

    return NextResponse.json({
      summary: comparison.summary,
      clarityScore: comparison.clarityScore,
      gaps: mappedGaps,
      overlaps: comparison.overlaps,
      raciIssues: comparison.raciIssues,
      managerBrief: comparison.managerBrief,
      proposals: savedProposals,
      implementationPlan,
    });
  } catch (err) {
    // Reset status on failure
    await db
      .update(claritySessions)
      .set({ status: "draft" })
      .where(eq(claritySessions.id, sessionId));

    return NextResponse.json(
      {
        error: "Comparison failed",
        details:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

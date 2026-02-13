// ════════════════════════════════════════════
// The Forge — Tool Executors
// Server-side execution of AI tool calls
// ════════════════════════════════════════════

import { db } from "@/lib/db";
import {
  teamRoles,
  stages,
  stageRoleAssignments,
  activities,
  activityCategories,
  handoffs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  detectOwnershipOverlaps,
  detectGaps,
  calculateHealthScore,
  crossReferenceBoundaries,
  analyseBelbinComposition,
  detectBelbinMismatches,
  findStretchGaps,
  summariseActivityAssignments,
  analyseRoleCoverage,
  analyseBelbinActivityFit,
} from "@/lib/analysis";
import type {
  TeamRole,
  Stage,
  Handoff,
  Activity,
  ActivityAssignment,
  ActivityCategory,
  StageRoleAssignment,
  RoleProgression,
} from "@/lib/types";

type WorkspaceData = {
  workspaceId: string;
  roles: TeamRole[];
  stages: Stage[];
  handoffs: Handoff[];
  activities: Activity[];
  activityAssignments: ActivityAssignment[];
  categories: ActivityCategory[];
  stageAssignments: StageRoleAssignment[];
  progressions: RoleProgression[];
};

// ── Create Role ──
export async function executeCreateRole(
  workspaceId: string,
  params: {
    name: string;
    jobTitle: string;
    corePurpose?: string;
    keyDeliverables?: string[];
    belbinPrimary?: string;
    belbinSecondary?: string;
    budgetLevel?: "owner" | "manager" | "awareness" | "none";
    overseesStageIds?: string[];
    colorIndex?: number;
  }
) {
  const [role] = await db
    .insert(teamRoles)
    .values({
      workspaceId,
      name: params.name,
      jobTitle: params.jobTitle,
      corePurpose: params.corePurpose ?? null,
      keyDeliverables: params.keyDeliverables ?? [],
      belbinPrimary: params.belbinPrimary ?? null,
      belbinSecondary: params.belbinSecondary ?? null,
      budgetLevel: params.budgetLevel ?? "none",
      overseesStageIds: params.overseesStageIds ?? [],
      colorIndex: params.colorIndex ?? 0,
    })
    .returning();

  return {
    success: true,
    role,
    message: `Created role "${params.jobTitle}" (${role.id})`,
  };
}

// ── Update Role ──
export async function executeUpdateRole(
  params: {
    roleId: string;
    name?: string;
    jobTitle?: string;
    corePurpose?: string;
    keyDeliverables?: string[];
    belbinPrimary?: string;
    belbinSecondary?: string;
    budgetLevel?: "owner" | "manager" | "awareness" | "none";
    colorIndex?: number;
  }
) {
  try {
    const updates: Partial<typeof teamRoles.$inferInsert> = {};
    if (params.name !== undefined) updates.name = params.name;
    if (params.jobTitle !== undefined) updates.jobTitle = params.jobTitle;
    if (params.corePurpose !== undefined) updates.corePurpose = params.corePurpose;
    if (params.keyDeliverables !== undefined) updates.keyDeliverables = params.keyDeliverables;
    if (params.belbinPrimary !== undefined) updates.belbinPrimary = params.belbinPrimary;
    if (params.belbinSecondary !== undefined) updates.belbinSecondary = params.belbinSecondary;
    if (params.budgetLevel !== undefined) updates.budgetLevel = params.budgetLevel;
    if (params.colorIndex !== undefined) updates.colorIndex = params.colorIndex;

    const [updatedRole] = await db
      .update(teamRoles)
      .set(updates)
      .where(eq(teamRoles.id, params.roleId))
      .returning();

    if (!updatedRole) {
      return {
        success: false,
        role: null,
        message: `Role ${params.roleId} not found`,
      };
    }

    return {
      success: true,
      role: updatedRole,
      message: `Successfully updated "${updatedRole.jobTitle}". Core purpose: ${updatedRole.corePurpose || 'not set'}. Key deliverables: ${updatedRole.keyDeliverables?.length || 0} items.`,
    };
  } catch (error) {
    console.error('Update role error:', error);
    return {
      success: false,
      role: null,
      message: `Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ── Create Stage ──
export async function executeCreateStage(
  workspaceId: string,
  params: { name: string; sortOrder?: number }
) {
  const existing = await db
    .select()
    .from(stages)
    .where(eq(stages.workspaceId, workspaceId));

  const [stage] = await db
    .insert(stages)
    .values({
      workspaceId,
      name: params.name,
      sortOrder: params.sortOrder ?? existing.length,
    })
    .returning();

  return {
    success: true,
    stage,
    message: `Created pipeline stage "${params.name}" at position ${stage.sortOrder}`,
  };
}

// ── Assign Role to Stage ──
export async function executeAssignRoleToStage(params: {
  roleId: string;
  stageId: string;
}) {
  const [assignment] = await db
    .insert(stageRoleAssignments)
    .values({
      stageId: params.stageId,
      roleId: params.roleId,
      sortOrder: 0,
    })
    .returning();

  return {
    success: true,
    assignment,
    message: `Assigned role to stage`,
  };
}

// ── Create Activity ──
export async function executeCreateActivity(
  workspaceId: string,
  params: {
    name: string;
    categoryId?: string;
    stageId?: string;
    notes?: string;
  }
) {
  const [activity] = await db
    .insert(activities)
    .values({
      workspaceId,
      name: params.name,
      categoryId: params.categoryId ?? null,
      stageId: params.stageId ?? null,
      notes: params.notes ?? null,
    })
    .returning();

  return {
    success: true,
    activity,
    message: `Created activity "${params.name}"`,
  };
}

// ── Create Category ──
export async function executeCreateCategory(
  workspaceId: string,
  params: {
    name: string;
    belbinIdeal?: string[];
    belbinFitReason?: string;
  }
) {
  const existing = await db
    .select()
    .from(activityCategories)
    .where(eq(activityCategories.workspaceId, workspaceId));

  const [category] = await db
    .insert(activityCategories)
    .values({
      workspaceId,
      name: params.name,
      sortOrder: existing.length,
      belbinIdeal: params.belbinIdeal ?? [],
      belbinFitReason: params.belbinFitReason ?? null,
    })
    .returning();

  return {
    success: true,
    category,
    message: `Created activity category "${params.name}"`,
  };
}

// ── Create Handoff ──
export async function executeCreateHandoff(
  workspaceId: string,
  params: {
    fromStageId: string;
    toStageId: string;
    notes?: string;
    sla?: string;
    tensions?: string[];
  }
) {
  const [handoff] = await db
    .insert(handoffs)
    .values({
      workspaceId,
      fromStageId: params.fromStageId,
      toStageId: params.toStageId,
      notes: params.notes ?? null,
      sla: params.sla ?? null,
      tensions: params.tensions ?? [],
    })
    .returning();

  return {
    success: true,
    handoff,
    message: `Created handoff zone`,
  };
}

// ── Analyse Workspace ──
export function executeAnalyseWorkspace(
  data: WorkspaceData,
  focusArea?: string
) {
  const focus = focusArea ?? "full";
  const results: Record<string, unknown> = {};

  if (focus === "full" || focus === "health") {
    results.healthScore = calculateHealthScore(
      data.roles,
      data.stages,
      data.stageAssignments,
      data.handoffs,
      data.activities,
      data.activityAssignments
    );
  }

  if (focus === "full" || focus === "gaps") {
    results.gaps = detectGaps(
      data.stages,
      data.stageAssignments,
      data.handoffs,
      data.activities,
      data.activityAssignments
    );
  }

  if (focus === "full" || focus === "overlaps") {
    results.overlaps = detectOwnershipOverlaps(data.roles);
  }

  if (focus === "full" || focus === "belbin") {
    results.belbinComposition = analyseBelbinComposition(data.roles);
    results.belbinMismatches = detectBelbinMismatches(
      data.categories,
      data.activities,
      data.activityAssignments,
      data.roles
    );
    results.belbinActivityFit = analyseBelbinActivityFit(
      data.categories,
      data.roles
    );
  }

  if (focus === "full" || focus === "boundaries") {
    results.boundaries = crossReferenceBoundaries(data.roles);
  }

  if (focus === "full" || focus === "career") {
    results.stretchGaps = findStretchGaps(
      data.roles,
      data.progressions,
      data.activities,
      data.activityAssignments
    );
    results.activitySummary = summariseActivityAssignments(
      data.activities,
      data.activityAssignments
    );
    results.roleCoverage = analyseRoleCoverage(
      data.roles,
      data.activities,
      data.activityAssignments,
      data.categories
    );
  }

  return {
    success: true,
    analysis: results,
    message: `Workspace analysis complete (focus: ${focus})`,
  };
}

// ── Search Role Online ──
export async function executeSearchRoleOnline(params: {
  query: string;
  industry?: string;
}) {
  // Use the AI to synthesise — we'll search via a web search API or fallback
  // For now, we construct a rich prompt that the AI can use to generate role data
  const searchQuery = params.industry
    ? `${params.query} ${params.industry} job description responsibilities skills`
    : `${params.query} job description responsibilities skills deliverables`;

  try {
    const apiKey =
      process.env.GOOGLE_SEARCH_API_KEY ?? process.env.GOOGLE_API_KEY;
    const cx =
      process.env.GOOGLE_SEARCH_CX ?? process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !cx) {
      return {
        success: true,
        results: null,
        message:
          "Web search is not configured. Set GOOGLE_SEARCH_API_KEY (or GOOGLE_API_KEY) and GOOGLE_SEARCH_CX (or GOOGLE_SEARCH_ENGINE_ID) to enable live search. Please provide a comprehensive role definition based on industry standards.",
      };
    }

    // Try Google Custom Search or fallback to synthesised knowledge
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&num=5`,
      { next: { revalidate: 3600 } }
    );

    if (response.ok) {
      const data = await response.json();
      const snippets = (
        data.items as { title: string; snippet: string; link: string }[]
      )
        ?.slice(0, 5)
        .map(
          (item: { title: string; snippet: string; link: string }) =>
            `**${item.title}**\n${item.snippet}\nSource: ${item.link}`
        )
        .join("\n\n");

      return {
        success: true,
        results: snippets,
        message: `Found ${data.items?.length ?? 0} results for "${params.query}"`,
      };
    }
  } catch {
    // Fallback silently
  }

  // Fallback: return a signal for the AI to use its training knowledge
  return {
    success: true,
    results: null,
    message: `Web search unavailable. Synthesising role data from training knowledge for: "${params.query}"${params.industry ? ` in ${params.industry}` : ""}. Please provide a comprehensive role definition based on industry standards.`,
  };
}

// ── Suggest Structure ──
export function executeSuggestStructure(params: {
  businessDescription: string;
  teamSize?: number;
  industry?: string;
}) {
  // This returns context for the AI to generate suggestions
  return {
    success: true,
    context: {
      description: params.businessDescription,
      teamSize: params.teamSize,
      industry: params.industry,
    },
    message: `Analysing business: "${params.businessDescription}". Generate a recommended team structure with pipeline stages, roles (including Belbin profiles), and activity categories.`,
  };
}

// ════════════════════════════════════════════
// Phase 2: Workspace-wide Overlap Detection & Handoff SLA Suggestions
// Grounded in Coordination Theory (Thompson 1967), RACI,
// Transaction Cost Economics, Team Dynamics (Tuckman 1965),
// and Handoff Research (Grenny et al.)
// ════════════════════════════════════════════

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type {
  TeamRole,
  Handoff,
  Stage,
  OwnershipCategory,
  StageRoleAssignment,
} from "@/lib/types";

// ── Overlap Detection ──

const overlapDetectionSchema = z.object({
  // ── Health summary ──
  workspaceHealth: z.object({
    overallScore: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Workspace ownership health: 0-40 = high dysfunction, 41-70 = functional but friction, 71-85 = healthy, 86-100 = optimised"
      ),
    activeOverlapCount: z
      .number()
      .describe("Number of overlaps that need resolution"),
    criticalGapCount: z
      .number()
      .describe("Number of unowned critical responsibilities"),
    estimatedWeeklyFrictionHours: z
      .number()
      .describe(
        "Estimated hours per week lost to coordination overhead from overlaps — based on: each critical overlap ≈ 2-4 hrs/wk meetings + rework, warning ≈ 0.5-1 hr/wk, per research on coordination costs"
      ),
    topRiskStatement: z
      .string()
      .describe(
        "Single most important risk in the workspace right now, written for a manager"
      ),
  }),

  // ── Overlap analysis ──
  overlaps: z.array(
    z.object({
      item: z
        .string()
        .describe("The specific overlapping responsibility or domain"),
      roles: z
        .array(
          z.object({
            roleId: z.string(),
            roleTitle: z.string(),
            ownershipType: z
              .enum(["primary", "contributor", "unclear"])
              .describe("How this role relates to the item"),
            evidence: z
              .string()
              .describe(
                "Specific text from the role definition that shows this claim (e.g. 'owns[Strategy: brand positioning]')"
              ),
          })
        )
        .describe("Roles involved in this overlap — with evidence"),
      severity: z.enum(["critical", "warning", "info"]),
      overlapType: z
        .enum([
          "dual_accountability",
          "unclear_boundary",
          "scope_creep",
          "legitimate_collaboration",
          "sequential_handoff_gap",
        ])
        .describe(
          "Classification: dual_accountability = RACI violation, unclear_boundary = missing doesNotOwn, scope_creep = expanding beyond spec, legitimate_collaboration = OK if declared, sequential_handoff_gap = boundary between pipeline stages"
        ),
      interdependenceType: z
        .enum(["pooled", "sequential", "reciprocal"])
        .describe(
          "Thompson's coordination type — determines friction cost multiplier"
        ),
      weeklyFrictionCost: z
        .string()
        .describe(
          "Estimated weekly cost: 'X hours of meetings/clarifications/rework per week'"
        ),
      recommendation: z
        .string()
        .describe(
          "Specific resolution: 'Assign X to RoleA.owns[], add X to RoleB.doesNotOwn[], declare RoleB as contributor'"
        ),
      suggestedOwner: z
        .string()
        .describe(
          "The role title that should be primary owner — with reasoning"
        ),
      ownershipRationale: z
        .string()
        .describe(
          "WHY this role should own it: proximity to work, pipeline position, expertise, or existing authority"
        ),
      conversationNeeded: z
        .boolean()
        .describe(
          "True if resolving this overlap requires a conversation between role holders"
        ),
    })
  ),

  // ── Gap analysis ──
  gaps: z.array(
    z.object({
      item: z
        .string()
        .describe("The responsibility or domain with no clear owner"),
      category: z
        .enum([
          "strategic",
          "operational",
          "handoff_boundary",
          "leadership",
          "cross_functional",
        ])
        .describe("Type of gap — helps prioritise"),
      severity: z
        .enum(["critical", "high", "medium"])
        .describe(
          "critical = actively causing problems now, high = will cause problems within weeks, medium = latent risk"
        ),
      likelyOwner: z
        .string()
        .describe("Role title most likely to own this — with reasoning"),
      reason: z
        .string()
        .describe("Why this role is the best fit to own it"),
      riskIfUnowned: z
        .string()
        .describe(
          "What happens if nobody owns this — specific scenario, not generic"
        ),
    })
  ),

  // ── Team structure observations ──
  structuralInsights: z.array(
    z.object({
      type: z
        .enum([
          "span_of_control",
          "role_overload",
          "role_underload",
          "single_point_of_failure",
          "missing_role",
          "communication_bottleneck",
        ])
        .describe("Type of structural observation"),
      description: z
        .string()
        .describe("What was observed — specific and evidence-based"),
      affectedRoles: z
        .array(z.string())
        .describe("Role titles involved"),
      recommendation: z
        .string()
        .describe("What the manager should consider doing"),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),

  // ── Manager brief ──
  managerBrief: z.object({
    fixFirst: z
      .string()
      .describe(
        "The single overlap or gap that should be resolved first — with reasoning"
      ),
    quickWins: z
      .array(z.string())
      .describe(
        "Boundary declarations or doesNotOwn additions that can be made in <5 minutes and immediately reduce ambiguity"
      ),
    conversationsNeeded: z
      .array(
        z.object({
          between: z
            .array(z.string())
            .describe("Role titles who need to talk"),
          about: z
            .string()
            .describe("Specific topic to resolve"),
          suggestedOutcome: z
            .string()
            .describe("What a good resolution looks like"),
        })
      )
      .describe("Conversations required to resolve contested overlaps"),
  }),
});

export type WorkspaceOverlapResult = z.infer<typeof overlapDetectionSchema>;

export async function detectWorkspaceOverlaps(params: {
  roles: TeamRole[];
  stages: Stage[];
  handoffs: Handoff[];
  stageAssignments: StageRoleAssignment[];
}): Promise<WorkspaceOverlapResult> {
  const { roles, stages, handoffs, stageAssignments } = params;

  const rolesContext = roles.map((r) => ({
    id: r.id,
    title: r.jobTitle,
    purpose: r.corePurpose,
    owns: (r.owns as OwnershipCategory[]) ?? [],
    doesNotOwn: (r.doesNotOwn as string[]) ?? [],
    deliverables: (r.keyDeliverables as string[]) ?? [],
    contributesTo: (r.contributesTo as string[]) ?? [],
    outputs: (r.outputs as string[]) ?? [],
    isLeadership:
      Array.isArray(r.overseesStageIds) &&
      (r.overseesStageIds as string[]).length > 0,
  }));

  const stageContext = stages.map((s) => {
    const assigned = stageAssignments
      .filter((sa) => sa.stageId === s.id)
      .map((sa) => {
        const role = roles.find((r) => r.id === sa.roleId);
        return role?.jobTitle ?? sa.roleId;
      });
    return { name: s.name, roles: assigned };
  });

  const handoffContext = handoffs.map((h) => {
    const from = stages.find((s) => s.id === h.fromStageId)?.name ?? "Unknown";
    const to = stages.find((s) => s.id === h.toStageId)?.name ?? "Unknown";
    return {
      from,
      to,
      sla: h.sla,
      slaOwner: h.slaOwner,
      tensions: (h.tensions as string[]) ?? [],
    };
  });

  const { object } = await generateObject({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    schema: overlapDetectionSchema,
    prompt: `You are a senior organisational psychologist conducting a workspace health audit. Your analysis must be evidence-based, defensible, and immediately useful to a manager who owns this team structure.

RESEARCH FRAMEWORKS:

1. COORDINATION THEORY (Thompson, 1967):
   - Pooled: Shared resources, independent work → friction cost: ~0.5 hrs/wk per overlap
   - Sequential: A→B handoffs → friction cost: ~1-2 hrs/wk per overlap (waiting, clarifying)
   - Reciprocal: Iterative collaboration → friction cost: ~2-4 hrs/wk per overlap (meetings, rework, conflict)
   Classify each overlap by interdependence type to estimate real friction cost.

2. RACI ANALYSIS:
   - Scan ALL ownership declarations across ALL roles for conflicts
   - Flag: same item in multiple roles' owns[] = dual accountability (critical)
   - Flag: item in one role's owns[] but also in another's contributesTo[] without doesNotOwn declaration = unclear boundary
   - Flag: important domains with NO role claiming ownership = gap

3. DIFFUSION OF RESPONSIBILITY (Darley & Latané, 1968):
   - When everyone is "responsible", nobody acts → items fall through cracks
   - Quantify: how many domains have >1 "owner" and no clear primary?
   - Each unresolved = estimated ~1 dropped ball per month

4. SPAN OF CONTROL & STRUCTURAL ANALYSIS:
   - Roles with >8 ownership domains may be overloaded
   - Single point of failure: only one role owns a critical area with no backup/contributor
   - Communication bottleneck: role that appears in >50% of handoffs
   - Missing role: responsibilities that exist in no role definition

5. EVIDENCE-BASED REASONING:
   - Every overlap claim must cite SPECIFIC text from role definitions
   - Don't flag things that aren't actually problematic
   - Distinguish "concerning" from "fine — just needs a contributor declaration"

WORKSPACE DATA:

ROLES:
${rolesContext.map((r) => `- ${r.title} (${r.id}): purpose="${r.purpose}", owns=[${r.owns.map((o) => `${o.title}: ${o.items.join(", ")}`).join("; ")}], doesNotOwn=[${r.doesNotOwn.join(", ")}], deliverables=[${r.deliverables.join(", ")}], contributesTo=[${r.contributesTo.join(", ")}], outputs=[${r.outputs.join(", ")}]${r.isLeadership ? " [LEADERSHIP]" : ""}`).join("\n")}

PIPELINE STAGES:
${stageContext.map((s) => `- ${s.name}: [${s.roles.join(", ")}]`).join("\n")}

HANDOFFS:
${handoffContext.map((h) => `- ${h.from} → ${h.to}: SLA="${h.sla ?? "none"}", owner="${h.slaOwner ?? "none"}", tensions=[${h.tensions.join(", ")}]`).join("\n")}

ANALYSIS REQUIREMENTS:
1. WORKSPACE HEALTH SCORE: Calculate honestly. Don't inflate. Factor in:
   - Number and severity of overlaps (critical = -15pts, warning = -5pts, info = -1pt)
   - Number of gaps (critical = -10pts, high = -5pts)
   - Missing handoff SLAs (-3pts each)
   - Start from 100 and subtract

2. FRICTION HOURS: Estimate conservatively but realistically using Thompson's framework:
   - Reciprocal overlaps × 3 hrs/wk + Sequential overlaps × 1.5 hrs/wk + Pooled × 0.5 hrs/wk
   - This gives managers a concrete "cost" to motivate action

3. OVERLAPS: Cite specific evidence from role definitions. Include ownership rationale (WHY this role should be primary).

4. GAPS: Categorise and prioritise. Critical gaps at handoff boundaries are most urgent.

5. STRUCTURAL INSIGHTS: Go beyond overlaps — identify systemic issues (role overload, single points of failure, communication bottlenecks).

6. MANAGER BRIEF: What to fix first, what quick wins exist, and what conversations are needed.

Be thorough but not alarmist. If the workspace is well-designed, say so and explain why.`,
  });

  return object;
}

// ── Handoff SLA Suggestions ──

const handoffSLASchema = z.object({
  // ── Handoff health overview ──
  handoffHealth: z.object({
    coveredHandoffs: z
      .number()
      .describe("Number of handoffs with SLAs and clear owners"),
    uncoveredHandoffs: z
      .number()
      .describe("Number of handoffs missing SLAs or owners"),
    highestRiskHandoff: z
      .string()
      .describe("The handoff most likely to cause failure — with reasoning"),
    estimatedWeeklyWaitHours: z
      .number()
      .describe(
        "Estimated total hours per week of work waiting at handoff boundaries — based on: each uncovered handoff ≈ 2-5 hrs/wk waiting, covered but slow ≈ 1 hr/wk"
      ),
  }),

  suggestions: z.array(
    z.object({
      fromStage: z.string(),
      toStage: z.string(),
      existingHandoffId: z.string().nullable(),
      suggestedSLA: z
        .string()
        .describe(
          "A specific, measurable SLA — not 'ASAP' but '24 business hours' or 'same sprint'"
        ),
      slaRationale: z
        .string()
        .describe(
          "WHY this timeframe: based on downstream dependency urgency, work complexity, and realistic capacity"
        ),
      suggestedOwner: z
        .string()
        .describe("Which role should be accountable for meeting this SLA"),
      ownerRationale: z
        .string()
        .describe(
          "WHY this role: proximity to completion criteria, ability to push, existing authority"
        ),
      completionCriteria: z
        .array(z.string())
        .describe(
          "Specific 'done' checklist — what must be true for this handoff to be complete. E.g. 'Design files uploaded to shared drive', 'QA checklist passed', 'Stakeholder sign-off received'"
        ),
      doesNotOwnBoundaries: z
        .array(z.string())
        .describe(
          "Things that do NOT cross this boundary — prevents scope creep and blame shifting"
        ),
      escalationPath: z
        .string()
        .describe(
          "What happens when the SLA is breached: who gets notified, what's the fallback. E.g. 'If breached → notify Team Lead → reassign within 4 hours'"
        ),
      explanation: z
        .string()
        .describe("Manager-friendly explanation of why this matters"),
      priority: z.enum(["high", "medium", "low"]),
      riskIfMissing: z
        .string()
        .describe(
          "What happens without this SLA — specific downstream consequences (delays, rework, blocked teams)"
        ),
    })
  ),

  // ── Process improvement suggestions ──
  processInsights: z.array(
    z.object({
      type: z
        .enum([
          "bottleneck",
          "unnecessary_handoff",
          "missing_feedback_loop",
          "automation_opportunity",
          "stage_consolidation",
        ])
        .describe("Type of process observation"),
      description: z.string(),
      affectedStages: z.array(z.string()),
      recommendation: z.string(),
    })
  ),
});

export type HandoffSLASuggestion = z.infer<
  typeof handoffSLASchema
>["suggestions"][number];

export type HandoffHealthSummary = z.infer<
  typeof handoffSLASchema
>["handoffHealth"];

export type ProcessInsight = z.infer<
  typeof handoffSLASchema
>["processInsights"][number];

export async function suggestHandoffSLAs(params: {
  roles: TeamRole[];
  stages: Stage[];
  handoffs: Handoff[];
  stageAssignments: StageRoleAssignment[];
}): Promise<z.infer<typeof handoffSLASchema>> {
  const { roles, stages, handoffs, stageAssignments } = params;

  const stageContext = stages
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const assigned = stageAssignments
        .filter((sa) => sa.stageId === s.id)
        .map((sa) => {
          const role = roles.find((r) => r.id === sa.roleId);
          return role?.jobTitle ?? "Unknown";
        });
      return { id: s.id, name: s.name, roles: assigned };
    });

  const handoffContext = handoffs.map((h) => {
    const from = stages.find((s) => s.id === h.fromStageId);
    const to = stages.find((s) => s.id === h.toStageId);
    return {
      id: h.id,
      from: from?.name ?? "Unknown",
      to: to?.name ?? "Unknown",
      currentSLA: h.sla,
      currentOwner: h.slaOwner,
      tensions: (h.tensions as string[]) ?? [],
      notes: h.notes,
    };
  });

  const { object } = await generateObject({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    schema: handoffSLASchema,
    prompt: `You are a senior operations psychologist specialising in workflow optimisation and handoff design. Your recommendations must be evidence-based, specific, and immediately implementable by a manager.

RESEARCH FRAMEWORKS:

1. HANDOFF FAILURE RESEARCH:
   - 80% of execution failures occur at handoff boundaries (Grenny et al., 2013)
   - Root causes: ambiguous ownership (who pushes?), unclear completion criteria (what's "done"?), missing escalation (what if it's late?)
   - Solution: Every handoff needs THREE things: SLA + Completion Criteria + Escalation Path

2. QUEUE THEORY FOR SLA SIZING:
   - SLA should be based on: work complexity × variability × downstream urgency
   - Too tight → stress, gaming, quality shortcuts
   - Too loose → bottlenecks, blocked downstream teams, work piling up
   - Rule of thumb: SLA = (average completion time × 1.5) rounded to natural business units
   - For creative/knowledge work: use business days, not hours
   - For operational/repetitive work: use hours

3. COMPLETION CRITERIA (Definition of Done):
   - Each handoff needs a specific checklist of what must be true
   - Prevents: "I thought it was done" / "That's not what I asked for" disputes
   - Should be verifiable by the RECEIVER, not just the sender

4. BOUNDARY OBJECTS:
   - What crosses the boundary (deliverables, decisions, information)
   - What does NOT cross (stays with upstream, prevents scope creep)
   - Missing boundaries → roles assume they own downstream problems → conflict

5. ESCALATION DESIGN:
   - Every SLA needs a breach protocol — not punitive, but practical
   - Who gets notified? What's the fallback? How fast is the response?
   - Without escalation → breaches go unnoticed → SLAs become meaningless

6. PROCESS OPTIMISATION:
   - Look for unnecessary handoffs (stages that could be merged)
   - Look for missing feedback loops (downstream never tells upstream about quality)
   - Look for automation opportunities (handoffs that are purely administrative)

WORKSPACE DATA:

PIPELINE STAGES (in order):
${stageContext.map((s) => `- ${s.name}: staffed by [${s.roles.join(", ")}]`).join("\n")}

EXISTING HANDOFFS:
${handoffContext.map((h) => `- ${h.from} → ${h.to} (id: ${h.id}): SLA="${h.currentSLA ?? "MISSING"}", owner="${h.currentOwner ?? "MISSING"}", tensions=[${h.tensions.join(", ")}]${h.notes ? `, notes="${h.notes}"` : ""}`).join("\n")}

ROLE DETAILS (for owner selection):
${roles.map((r) => `- ${r.jobTitle}: purpose="${r.corePurpose ?? "unset"}", owns=[${((r.owns as OwnershipCategory[]) ?? []).map((o) => o.title).join(", ")}]`).join("\n")}

ANALYSIS REQUIREMENTS:
1. HANDOFF HEALTH: Calculate coverage honestly. Uncovered handoffs on critical paths = top priority.
2. WAIT TIME ESTIMATE: Each uncovered handoff ≈ 2-5 hrs/wk of blocked work. Be conservative but realistic.
3. For each suggestion:
   - SLA: Specific time (not "ASAP") + rationale based on queue theory
   - Owner: Upstream role that pushes + rationale
   - Completion criteria: 3-5 checkable items that define "done"
   - Boundaries: What does NOT cross this handoff
   - Escalation: Who, when, what action on breach
4. PROCESS INSIGHTS: Look beyond individual handoffs at systemic issues.
5. Only suggest changes to existing handoffs if there's a clear improvement.
6. Use the actual handoff IDs for existingHandoffId when updating existing handoffs.

Be practical. These recommendations will be shown to a manager who needs to act on them today.`,
  });

  return object;
}

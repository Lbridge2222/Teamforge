// ════════════════════════════════════════════
// AI Comparison — Expected vs Current role analysis
// Grounded in Role Theory (Kahn 1964), RACI methodology,
// Role Conflict research, and Boundary Theory
// ════════════════════════════════════════════

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { TeamRole, OwnershipCategory } from "@/lib/types";

const comparisonSchema = z.object({
  // ── Executive summary ──
  summary: z
    .string()
    .describe(
      "A 2-3 sentence executive summary a manager can read in 10 seconds to understand the situation"
    ),

  // ── Quantified clarity score (0-100) ──
  clarityScore: z.object({
    overall: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Overall role clarity score: 0-40 = high dysfunction risk, 41-70 = needs work, 71-85 = functional, 86-100 = well-defined"
      ),
    dimensions: z.object({
      purposeAlignment: z
        .number()
        .min(0)
        .max(100)
        .describe("How well the current purpose matches expectations"),
      boundaryClarity: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "How clearly defined the owns/does-not-own boundaries are"
        ),
      deliverableCompleteness: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "What percentage of expected deliverables are captured in the current model"
        ),
      overlapRisk: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Inverse of overlap severity — 100 = no overlaps, 0 = every responsibility is contested"
        ),
      accountabilityClarity: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "How clear it is WHO makes decisions — based on RACI single-accountability principle"
        ),
    }),
    interpretation: z
      .string()
      .describe(
        "One sentence explaining what this score means in practical terms for the manager"
      ),
  }),

  // ── Gap analysis ──
  gaps: z.array(
    z.object({
      area: z.string().describe("Specific area where a gap exists"),
      expected: z
        .string()
        .describe("What the job spec expects (quote or paraphrase)"),
      current: z
        .string()
        .describe("What the current role model has (or 'not defined')"),
      severity: z.enum(["high", "medium", "low"]),
      category: z
        .enum([
          "missing_accountability",
          "missing_deliverable",
          "missing_boundary",
          "purpose_mismatch",
          "skill_gap",
          "authority_gap",
          "scope_gap",
        ])
        .describe("Gap classification for tracking and prioritisation"),
      riskStatement: z
        .string()
        .describe(
          "Concrete risk in 'If not fixed → [consequence]' format. E.g. 'If not fixed → work falls to whoever is loudest, creating resentment and inconsistent quality'"
        ),
      affectedParties: z
        .array(z.string())
        .describe(
          "Role titles or teams who are affected by this gap (not just the role itself)"
        ),
    })
  ),

  // ── Overlap analysis ──
  overlaps: z.array(
    z.object({
      item: z
        .string()
        .describe("The specific overlapping responsibility or domain"),
      currentOwner: z
        .string()
        .describe("Who currently owns this (role title)"),
      expectedOwner: z
        .string()
        .describe("Who should own this per the spec (role title)"),
      overlapType: z
        .enum([
          "dual_accountability",
          "unclear_boundary",
          "scope_creep",
          "legitimate_collaboration",
        ])
        .describe(
          "Type of overlap: dual_accountability = RACI violation (critical), unclear_boundary = needs declaration, scope_creep = one role expanding into another, legitimate_collaboration = OK if declared as contributor"
        ),
      frictionCost: z
        .enum(["high", "medium", "low"])
        .describe(
          "Coordination cost this overlap imposes: meetings, clarifications, rework, conflict"
        ),
      recommendation: z
        .string()
        .describe(
          "Specific action to resolve this — not 'clarify ownership' but 'assign X to Role A, move Y to doesNotOwn on Role B'"
        ),
    })
  ),

  // ── RACI assessment ──
  raciIssues: z.array(
    z.object({
      domain: z
        .string()
        .describe("The responsibility or decision area"),
      issue: z
        .enum([
          "no_accountable",
          "multiple_accountable",
          "accountable_without_authority",
          "responsible_without_accountable",
        ])
        .describe("Specific RACI violation type"),
      currentState: z
        .string()
        .describe("How it's currently set up"),
      recommendation: z
        .string()
        .describe("What the correct RACI assignment should be"),
    })
  ),

  // ── Manager action items ──
  managerBrief: z.object({
    topPriority: z
      .string()
      .describe(
        "The single most important thing the manager should fix first, in one sentence"
      ),
    quickWins: z
      .array(z.string())
      .describe(
        "Changes that take <5 minutes but meaningfully reduce ambiguity (e.g. adding a doesNotOwn declaration)"
      ),
    conversationsNeeded: z
      .array(
        z.object({
          with: z
            .string()
            .describe("Who the manager needs to talk to (role title)"),
          about: z
            .string()
            .describe("What they need to agree on"),
          why: z
            .string()
            .describe("Why this conversation matters — the risk of not having it"),
        })
      )
      .describe(
        "Conversations the manager needs to have to resolve overlaps or unclear boundaries"
      ),
    doNothingRisk: z
      .string()
      .describe(
        "What happens if the manager ignores these findings — concrete organisational consequences over 3-6 months"
      ),
  }),
});

export type ComparisonResult = z.infer<typeof comparisonSchema>;

export async function compareRoleExpectations(params: {
  extracted: {
    title: string;
    purpose: string;
    responsibilities: string[];
    deliverables: string[];
    ownershipDomains: { title: string; items: string[] }[];
    doesNotOwn: string[];
    skills: string[];
    suggestedTier: string | null;
  };
  currentRole: TeamRole;
  allRoles: TeamRole[];
}): Promise<ComparisonResult> {
  const { extracted, currentRole, allRoles } = params;

  // Build context about other roles for overlap detection
  const otherRoles = allRoles
    .filter((r) => r.id !== currentRole.id)
    .map((r) => ({
      title: r.jobTitle,
      owns: (r.owns as OwnershipCategory[]) ?? [],
      doesNotOwn: (r.doesNotOwn as string[]) ?? [],
      deliverables: (r.keyDeliverables as string[]) ?? [],
    }));

  const currentOwns = (currentRole.owns as OwnershipCategory[]) ?? [];
  const currentDeliverables = (currentRole.keyDeliverables as string[]) ?? [];
  const currentDoesNotOwn = (currentRole.doesNotOwn as string[]) ?? [];

  const { object } = await generateObject({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    schema: comparisonSchema,
    prompt: `You are a senior organisational psychologist conducting a role clarity audit. Your findings must be defensible, specific, and immediately actionable for a manager who has 15 minutes to review them.

ANALYTICAL FRAMEWORKS:

1. ROLE THEORY (Kahn et al., 1964):
   - Role ambiguity → reduced performance, increased stress, higher turnover
   - Role conflict → burnout, disengagement, territorial disputes
   - Research: Each point of role ambiguity reduces performance by ~4-7% (meta-analysis: Tubre & Collins, 2000)

2. RACI SINGLE-ACCOUNTABILITY PRINCIPLE:
   - Exactly ONE Accountable per domain — multiple = conflict, zero = gap
   - "Responsible" ≠ "Accountable" — doing work ≠ owning the outcome
   - Flag every RACI violation explicitly

3. BOUNDARY THEORY (Ashforth et al., 2000):
   - Role boundaries must be explicitly declared, not assumed
   - Missing "does not own" = implicit scope creep over time
   - Boundary violations cause inter-role friction and resentment

4. CLARITY SCORING METHODOLOGY:
   Assess each dimension independently (0-100):
   - Purpose alignment: Does current purpose capture what the spec expects?
   - Boundary clarity: Are owns/doesNotOwn complete and unambiguous?
   - Deliverable completeness: What % of expected outputs are captured?
   - Overlap risk: How many responsibilities are contested by other roles?
   - Accountability clarity: For each domain, is it clear who makes the final call?
   Overall = weighted average (accountability 30%, boundaries 25%, deliverables 20%, purpose 15%, overlap 10%)

EXPECTED ROLE (from job spec):
- Title: ${extracted.title}
- Purpose: ${extracted.purpose}
- Responsibilities: ${JSON.stringify(extracted.responsibilities)}
- Deliverables: ${JSON.stringify(extracted.deliverables)}
- Ownership domains: ${JSON.stringify(extracted.ownershipDomains)}
- Does NOT own: ${extracted.doesNotOwn.join("; ")}
- Skills: ${JSON.stringify(extracted.skills)}
- Suggested tier: ${extracted.suggestedTier ?? "not specified"}

CURRENT ROLE MODEL:
- Title: ${currentRole.jobTitle}
- Purpose: ${currentRole.corePurpose ?? "not set"}
- Deliverables: ${currentDeliverables.join("; ") || "none defined"}
- Ownership: ${currentOwns.map((c) => `${c.title}: ${c.items.join(", ")}`).join("; ") || "none defined"}
- Does NOT own: ${currentDoesNotOwn.join("; ") || "none defined"}
- Contributes to: ${(currentRole.contributesTo as string[] ?? []).join("; ") || "none defined"}
- Outputs: ${(currentRole.outputs as string[] ?? []).join("; ") || "none defined"}
- Belbin: primary=${currentRole.belbinPrimary ?? "unset"}, secondary=${currentRole.belbinSecondary ?? "unset"}
- Budget level: ${currentRole.budgetLevel}
- System ownership: ${currentRole.systemOwnership ? JSON.stringify(currentRole.systemOwnership) : "none defined"}

OTHER ROLES IN THE WORKSPACE (for overlap/RACI analysis):
${otherRoles.map((r) => `- ${r.title}: owns [${r.owns.map((o) => `${o.title}: ${o.items.join(", ")}`).join("; ")}], doesNotOwn [${r.doesNotOwn.join(", ")}], deliverables [${r.deliverables.join(", ")}]`).join("\n")}

CRITICAL INSTRUCTIONS:
1. Score HONESTLY — don't inflate. A poorly defined role should score 20-40, not 60.
2. Every gap needs a concrete "If not fixed →" risk statement. No hand-waving.
3. For overlaps: specify the exact overlap TYPE and name both roles involved.
4. RACI issues: check EVERY responsibility from the spec — who's Accountable?
5. Manager brief: Give the manager their #1 priority, quick wins they can do NOW, and specific conversations they need to have (with whom, about what).
6. "Do nothing" risk: Describe what happens over 3-6 months if nothing changes — be realistic and specific.
7. Don't flag things that are genuinely fine. If the role is well-defined, say so.`,
  });

  return object;
}

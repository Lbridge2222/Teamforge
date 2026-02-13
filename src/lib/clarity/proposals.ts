// ════════════════════════════════════════════
// Proposal Generation — Turn comparison gaps into actionable fixes
// Grounded in Change Management, Effort-Impact Matrix,
// and Implementation Science
// ════════════════════════════════════════════

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type {
  TeamRole,
  OwnershipCategory,
  GapAnalysisItem,
  OverlapAnalysisItem,
  ProposalType,
} from "@/lib/types";

const proposalsSchema = z.object({
  proposals: z.array(
    z.object({
      type: z.enum([
        "edit_role",
        "add_ownership",
        "remove_ownership",
        "add_deliverable",
        "remove_deliverable",
        "set_boundary",
        "add_handoff_sla",
        "update_handoff_sla",
        "resolve_overlap",
      ]),
      field: z
        .string()
        .describe(
          "The role field to change: corePurpose, keyDeliverables, owns, doesNotOwn, contributesTo, outputs, etc."
        ),
      currentValue: z
        .unknown()
        .describe("Current value of the field (for display)"),
      proposedValue: z
        .unknown()
        .describe("Proposed new value for the field"),
      title: z
        .string()
        .describe(
          "Short action title, e.g. 'Add deliverable: Monthly pipeline report'"
        ),
      explanation: z
        .string()
        .describe(
          "Plain-language explanation: (1) what's wrong now, (2) what this change fixes, (3) who benefits"
        ),
      impact: z.enum(["high", "medium", "low"]),

      // ── New: implementation intelligence ──
      effort: z
        .enum(["trivial", "small", "medium", "large"])
        .describe(
          "Implementation effort: trivial = toggle/add text, small = single field update, medium = requires conversation with another role owner, large = restructuring across multiple roles"
        ),
      confidence: z
        .enum(["high", "medium", "low"])
        .describe(
          "AI confidence this is the right change: high = clear from evidence, medium = reasonable inference, low = ambiguous — manager should validate"
        ),
      requiresConversation: z
        .boolean()
        .describe(
          "True if this change affects another role and needs agreement before applying"
        ),
      affectedRoles: z
        .array(z.string())
        .describe(
          "Other role titles that would be affected if this change is applied"
        ),
      sequenceGroup: z
        .number()
        .min(1)
        .max(5)
        .describe(
          "Recommended application order: 1 = do first (foundations like purpose), 2 = core ownership, 3 = boundaries, 4 = deliverables, 5 = fine-tuning. Lower numbers should be applied before higher."
        ),
      reversible: z
        .boolean()
        .describe(
          "True if this change can be easily undone, false if it has cascading effects"
        ),
      doNothingCost: z
        .string()
        .describe(
          "What specifically happens if the manager skips this proposal — concrete weekly/monthly consequences"
        ),
    })
  ),
  implementationPlan: z.object({
    estimatedTime: z
      .string()
      .describe(
        "Total estimated time to review and apply all proposals (e.g. '20-30 minutes for model changes + 1-2 conversations')"
      ),
    suggestedSequence: z
      .string()
      .describe(
        "Plain-language guide: 'Start with proposals in group 1 (foundations), then group 2 (ownership). Group 3 changes need a conversation with [role] first.'"
      ),
    biggestRisk: z
      .string()
      .describe(
        "The biggest risk in implementing these changes — what could go wrong and how to mitigate"
      ),
  }),
});

export type GeneratedProposal = z.infer<
  typeof proposalsSchema
>["proposals"][number];

export type ImplementationPlan = z.infer<
  typeof proposalsSchema
>["implementationPlan"];

export async function generateProposals(params: {
  currentRole: TeamRole;
  gaps: GapAnalysisItem[];
  overlaps: OverlapAnalysisItem[];
  extracted: {
    title: string;
    purpose: string;
    responsibilities: string[] | { text: string }[];
    deliverables: string[] | { text: string }[];
    ownershipDomains: { title: string; items: string[] }[];
    doesNotOwn: string[];
  };
}): Promise<{ proposals: GeneratedProposal[]; implementationPlan: ImplementationPlan }> {
  const { currentRole, gaps, overlaps, extracted } = params;

  const currentOwns = (currentRole.owns as OwnershipCategory[]) ?? [];
  const currentDeliverables = (currentRole.keyDeliverables as string[]) ?? [];
  const currentDoesNotOwn = (currentRole.doesNotOwn as string[]) ?? [];
  const currentContributesTo = (currentRole.contributesTo as string[]) ?? [];
  const currentOutputs = (currentRole.outputs as string[]) ?? [];

  const { object } = await generateObject({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    schema: proposalsSchema,
    prompt: `You are a change management consultant generating an implementation plan for a role clarity improvement. Every proposal must pass the "manager test": could a busy manager understand it in 10 seconds and decide whether to apply it?

CHANGE MANAGEMENT PRINCIPLES:

1. EFFORT-IMPACT MATRIX:
   - Prioritise HIGH impact + LOW effort first (quick wins)
   - Flag HIGH effort changes that need conversations before applying
   - Never propose a change without explaining the cost of NOT making it

2. SEQUENCING (Implementation Science):
   - Group 1: Foundation (purpose, tier) — everything else depends on these
   - Group 2: Core ownership (owns[], doesNotOwn[]) — the structural backbone
   - Group 3: Boundaries (contributesTo[], cross-role declarations) — may need conversations
   - Group 4: Deliverables and outputs — specific measurable additions
   - Group 5: Fine-tuning (budget notes, system ownership details)

3. REVERSIBILITY & CONFIDENCE:
   - Mark proposals as reversible/irreversible so managers know what's safe to try
   - State confidence level honestly — if it's ambiguous, say so
   - Low-confidence proposals should suggest a validation step

4. AFFECTED PARTIES:
   - Every change that touches another role's territory must flag it
   - requiresConversation = true means "don't apply this until you've talked to the other role owner"

CURRENT ROLE: "${currentRole.jobTitle}"
- Purpose: ${currentRole.corePurpose ?? "not set"}
- Deliverables: ${JSON.stringify(currentDeliverables)}
- Ownership: ${JSON.stringify(currentOwns)}
- Does not own: ${JSON.stringify(currentDoesNotOwn)}
- Contributes to: ${JSON.stringify(currentContributesTo)}
- Outputs: ${JSON.stringify(currentOutputs)}
- System ownership: ${currentRole.systemOwnership ? JSON.stringify(currentRole.systemOwnership) : "none"}
- Budget: ${currentRole.budgetLevel}

EXPECTED (from job spec): "${extracted.title}"
- Purpose: ${extracted.purpose}
- Deliverables: ${JSON.stringify(extracted.deliverables)}
- Ownership: ${JSON.stringify(extracted.ownershipDomains)}
- Does not own: ${JSON.stringify(extracted.doesNotOwn)}

GAPS FOUND:
${gaps.map((g) => `- [${g.severity}] ${g.area}: expected "${g.expected}" but current has "${g.current}". Risk: ${g.riskStatement ?? g.explanation ?? "unspecified"}`).join("\n")}

OVERLAPS FOUND:
${overlaps.map((o) => `- ${o.item}: currently owned by "${o.currentOwner}", spec expects "${o.expectedOwner}". Type: ${o.overlapType ?? "unclassified"}. Recommendation: ${o.recommendation}`).join("\n")}

GENERATION RULES:
1. Each proposal = ONE atomic change. Don't bundle multiple field updates.
2. currentValue and proposedValue must be the EXACT data types the database expects:
   - keyDeliverables: string[]
   - owns: {title: string, items: string[]}[]
   - doesNotOwn: string[]
   - contributesTo: string[]
   - outputs: string[]
   - corePurpose: string
3. For array fields: show the FULL new array (existing items + addition, or existing items minus removal).
4. Explanation must cover: what's wrong → what this fixes → who benefits.
5. Every proposal needs a doNothingCost — make it specific enough to motivate action.
6. Don't propose changes that are cosmetic or don't reduce ambiguity.
7. Aim for 5-15 proposals. If fewer than 5, the role is already well-defined — say so in the plan.`,
  });

  return { proposals: object.proposals, implementationPlan: object.implementationPlan };
}

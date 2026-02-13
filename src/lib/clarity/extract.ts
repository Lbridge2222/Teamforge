// ════════════════════════════════════════════
// AI Extraction — Parse job specs into structured role data
// Grounded in Role Theory (Kahn 1964), Job Characteristics
// Model (Hackman & Oldham 1976), and RACI methodology
// ════════════════════════════════════════════

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const extractionSchema = z.object({
  title: z.string().describe("The job title extracted from the spec"),
  purpose: z
    .string()
    .describe(
      "A one-sentence core purpose statement: what this role EXISTS to deliver (not a list of tasks)"
    ),
  responsibilities: z
    .array(
      z.object({
        text: z.string().describe("The responsibility statement"),
        raciType: z
          .enum(["accountable", "responsible", "consulted", "informed"])
          .describe(
            "RACI classification: accountable = final decision authority, responsible = does the work, consulted = provides input, informed = needs to know"
          ),
        frequency: z
          .enum(["daily", "weekly", "periodic", "ad-hoc", "unclear"])
          .describe("How often this responsibility is exercised"),
        isCore: z
          .boolean()
          .describe(
            "True if this is a core/defining responsibility vs a peripheral/secondary one"
          ),
      })
    )
    .describe("Distinct responsibilities extracted from the spec"),
  deliverables: z
    .array(
      z.object({
        text: z.string().describe("Concrete output or deliverable"),
        measurable: z
          .boolean()
          .describe("Whether this deliverable has clear success criteria"),
        suggestedMetric: z
          .string()
          .nullable()
          .describe(
            "If not measurable, suggest how a manager could measure quality/completion"
          ),
      })
    )
    .describe("Concrete outputs this role is accountable for"),
  ownershipDomains: z
    .array(
      z.object({
        title: z.string().describe("Category name for this ownership area"),
        items: z
          .array(z.string())
          .describe("Specific items owned within this category"),
        decisionRights: z
          .enum(["full", "shared", "advisory", "unclear"])
          .describe(
            "Level of decision authority: full = unilateral, shared = joint, advisory = recommends only"
          ),
      })
    )
    .describe("Domains of ownership grouped by category with authority level"),
  doesNotOwn: z
    .array(z.string())
    .describe(
      "Things explicitly excluded from this role's scope, or that are clearly outside the described responsibilities. Infer from context even if not stated — e.g. if spec says 'supports engineering' the role does NOT own engineering decisions."
    ),
  contributesTo: z
    .array(z.string())
    .describe(
      "Areas where this role provides input/support but does NOT have final decision authority. Inferred from language like 'supports', 'collaborates', 'assists', 'partners with'."
    ),
  skills: z
    .array(
      z.object({
        text: z.string().describe("Skill or competency"),
        category: z
          .enum(["technical", "leadership", "interpersonal", "domain", "strategic"])
          .describe("Skill category"),
        required: z
          .boolean()
          .describe("True if stated as required, false if preferred/nice-to-have"),
      })
    )
    .describe("Key skills, competencies, or qualifications"),
  suggestedTier: z
    .enum(["entry", "mid", "senior", "lead", "head", "director"])
    .nullable()
    .describe("Suggested seniority tier based on language cues"),
  autonomyLevel: z
    .enum(["low", "moderate", "high", "full"])
    .describe(
      "Hackman & Oldham autonomy dimension: how much independent decision-making is expected"
    ),
  spanOfInfluence: z
    .enum(["individual", "team", "cross-team", "department", "organization"])
    .describe("How wide this role's impact reaches based on the spec language"),
  ambiguities: z
    .array(
      z.object({
        area: z.string().describe("What's ambiguous"),
        quote: z
          .string()
          .describe("The spec text that's unclear (paraphrased)"),
        risk: z
          .string()
          .describe(
            "Why this ambiguity matters to a manager — what could go wrong"
          ),
        suggestedClarification: z
          .string()
          .describe("A specific question the manager should answer to resolve this"),
      })
    )
    .describe(
      "Ambiguities in the spec that create role conflict or confusion risk. Flag vague language, overlapping scope, or missing boundaries."
    ),
  redFlags: z
    .array(z.string())
    .describe(
      "Structural red flags: signs of role overload, impossible scope, contradictory expectations, or 'unicorn' requirements that no single person can realistically fulfill"
    ),
});

export type ExtractedRole = z.infer<typeof extractionSchema>;

export async function extractRoleExpectations(input: {
  text?: string;
  url?: string;
}): Promise<ExtractedRole> {
  let content = input.text ?? "";

  // If a URL was provided, fetch its text content
  if (input.url && !content) {
    try {
      const res = await fetch(input.url, {
        headers: { "User-Agent": "TeamForge-Bot/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        // Strip HTML tags to get plain text
        content = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 15000); // Cap at 15k chars for the LLM
      }
    } catch {
      throw new Error(
        "Could not fetch the URL. Please paste the job spec text instead."
      );
    }
  }

  if (!content || content.trim().length < 20) {
    throw new Error(
      "Please provide a job spec with at least a few sentences."
    );
  }

  const { object } = await generateObject({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    schema: extractionSchema,
    prompt: `You are a senior organisational psychologist with expertise in Role Theory (Kahn et al., 1964), the Job Characteristics Model (Hackman & Oldham, 1976), and RACI methodology. Analyse the following job specification and extract structured role data.

YOUR ANALYTICAL APPROACH:

1. RESPONSIBILITY CLASSIFICATION (RACI):
   - "Accountable" = final decision-maker, the buck stops here (language: "owns", "drives", "leads", "is responsible for", "ensures")
   - "Responsible" = does the work but someone else approves (language: "executes", "implements", "delivers", "manages")
   - "Consulted" = provides input (language: "advises", "supports", "collaborates", "partners with")
   - "Informed" = needs to know (language: "reports to", "keeps updated")
   Managers need this to distinguish what this person DECIDES vs what they DO vs what they ADVISE ON.

2. BOUNDARY INFERENCE:
   - Explicitly stated boundaries → doesNotOwn
   - Implicit boundaries → if spec narrows scope (e.g. "within the marketing team"), infer what's OUT of scope
   - "Supports X" means does NOT own X — extract the boundary
   - contributesTo = areas with influence but no decision authority

3. DELIVERABLE QUALITY:
   - Flag deliverables that lack measurable success criteria
   - Suggest how a manager could measure each one (KPI, completion criteria, or quality gate)
   - Vague deliverables = manager can't evaluate performance = unfair to employee

4. AMBIGUITY DETECTION (critical for managers):
   - Vague scope ("as needed", "various", "other duties") → flag as ambiguity
   - Overlapping language ("leads" + "supports" for same area) → flag as role conflict risk
   - Missing boundaries (spec doesn't say what's out of scope) → flag
   - Each ambiguity gets a specific manager question to resolve it

5. RED FLAGS (structural problems):
   - >12 core responsibilities → role overload risk (research: optimal is 5-8 key accountabilities)
   - Mix of strategic + tactical + operational → likely needs splitting
   - Contradictory expectations (e.g., "autonomous" + "seeks approval for everything")
   - "Unicorn" skill requirements that don't realistically coexist
   - Accountability without authority (responsibility without decision rights)

6. JOB CHARACTERISTICS (Hackman & Oldham):
   - Autonomy: How much discretion in work methods and timing?
   - Span of influence: Individual contributor → team → cross-team → department → org?

Be thorough and specific. Extract 5-15 responsibilities, 3-10 deliverables, and 2-6 ownership domains.
Every field should help a manager make a concrete decision about this role.

Job Specification:
${content}`,
  });

  return object;
}

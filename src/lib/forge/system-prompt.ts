// ════════════════════════════════════════════
// The Forge — System Prompt
// The AI persona: team psychologist, career architect, HR strategist
// ════════════════════════════════════════════

export function buildForgeSystemPrompt(workspaceContext: string): string {
  return `You are **The Forge** — an AI team architect embedded inside TeamForge, an organisational design platform.

## YOUR IDENTITY
You are a fusion of team psychologist, career designer, and HR strategist. You speak with confident expertise but approachable warmth — like the best consultant someone's ever worked with. You have a subtle sci-fi edge to your personality, as if you're an intelligence forged in the fires of decades of organisational research.

## YOUR VOICE
- Direct, clear, insightful — never corporate jargon soup
- You reference frameworks naturally: Belbin, Radical Candor (Rock Star/Superstar), Hackman & Oldham's Job Characteristics, RAPID decision rights, Daniel Pink's Drive, Lencioni's Working Genius
- You use metaphors from forging, crafting, building — "let's shape this role", "that's a structural weak point", "the heat map shows friction here"
- When something is wrong, you say so clearly — you don't sugarcoat
- Brief by default. Expand only when the user asks for depth
- Use markdown formatting for clarity

## WHAT YOU CAN DO
1. **Design Roles** — Help users create and refine team roles with proper ownership models, Belbin types, deliverables, and career progression
2. **Analyse the Workspace** — Run diagnostics on the current org design: find gaps, overlaps, Belbin mismatches, missing SLAs, empty pipeline stages
3. **Scrape & Research Roles** — Search the internet for real job descriptions and market data to benchmark roles or suggest new ones
4. **Career Architecture** — Design progression paths, identify stretch assignments, configure growth tracks
5. **Team Psychology** — Analyse team composition through Belbin, identify tension points, suggest rebalancing
6. **Pipeline Design** — Help structure pipeline stages, handoff zones, and data flows
7. **Create Things** — Actually create stages, roles, activities, and assignments in the workspace when the user confirms

## CURRENT WORKSPACE STATE
${workspaceContext}

## IMPORTANT RULES
- **CRITICAL: Execute tools immediately when user intent is clear.** If the user says "yes", "do it", "let's do that", "update it", "go ahead", or similar affirmations after you've proposed a change, IMMEDIATELY use the appropriate tool. DO NOT just say "I've updated it" — actually call the tool.
- When creating or modifying workspace data, ALWAYS use the available tools. Never just describe what you'd do — actually do it.
- When the user confirms a proposed role definition, stage creation, or any workspace change, execute the tool in that same response.
- When the user asks you to create a role, ask clarifying questions if needed, then use the create_role tool.
- When analysing, reference specific roles, stages, and data from the workspace context above.
- If the workspace is empty, proactively suggest a starting structure based on what the user describes.
- When scraping roles from the web, synthesise the findings into TeamForge's format (Belbin, ownership, deliverables, etc.)
- Keep responses concise unless depth is requested.
- Use bullet points and headers for complex responses.
- If you're uncertain, say so — then offer your best hypothesis.

## TOOL EXECUTION PATTERNS
Recognize these user patterns and execute tools automatically:
- "yes" / "yeah" / "yep" / "sure" / "ok" / "sounds good" after a proposal → Execute the proposed action
- "do it" / "go ahead" / "let's do that" / "make it happen" → Execute immediately
- "update the [role/stage/etc]" → Look up the role/stage ID from workspace context, then use update_role or appropriate update tool
- "add [thing]" / "create [thing]" → Use the creation tool
- "assign [role] to [stage]" → Use assign_role_to_stage tool  
- User provides details for a role/stage after you asked → Create it with those details

**CRITICAL for updates:** When updating an existing role, you MUST find its ID from the workspace context above. 
1. Search the "Pipeline Stages" or "Roles" section for the exact job title
2. The ID appears in parentheses after the role name, like: "Chief Marketing Officer (c1a0c24e-f75a-4444-b953-38a5d0932b51)"
3. Extract just the UUID from the parentheses
4. Use update_role with that roleId plus the fields to update

Example: If workspace shows "Chief Marketing Officer (abc-123-def)", and user says "update the CMO with purpose X and deliverables Y", you call update_role with roleId "abc-123-def", corePurpose "X", and keyDeliverables array.

NEVER say "I've updated X" or "I've created Y" unless you actually called the tool. If you only proposed it, say "Shall I create this?" or "Want me to update that?"`;
}

export function buildWorkspaceContext(data: {
  workspaceName: string;
  stages: { id: string; name: string; sortOrder: number }[];
  roles: {
    id: string;
    name: string;
    jobTitle: string;
    corePurpose: string | null;
    belbinPrimary: string | null;
    belbinSecondary: string | null;
    overseesStageIds: unknown;
  }[];
  handoffs: { id: string; fromStageId: string; toStageId: string; sla: string | null }[];
  activities: { id: string; name: string; categoryId: string | null }[];
  categories: { id: string; name: string }[];
  stageAssignments: { stageId: string; roleId: string }[];
  progressions: { roleId: string; tier: string | null; growthTrack: string | null }[];
}): string {
  const {
    workspaceName,
    stages,
    roles,
    handoffs,
    activities,
    categories,
    stageAssignments,
    progressions,
  } = data;

  const lines: string[] = [];
  lines.push(`**Workspace:** ${workspaceName}`);

  // Stages with their roles
  if (stages.length > 0) {
    lines.push(`\n**Pipeline Stages (${stages.length}):**`);
    for (const stage of stages.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const stageRoleIds = stageAssignments
        .filter((sa) => sa.stageId === stage.id)
        .map((sa) => sa.roleId);
      const stageRoles = roles.filter((r) => stageRoleIds.includes(r.id));
      const roleNames = stageRoles.map((r) => r.jobTitle).join(", ") || "empty";
      lines.push(`- ${stage.name} (${stage.id}): [${roleNames}]`);
    }
  } else {
    lines.push("\n**Pipeline:** No stages defined yet.");
  }

  // Roles
  if (roles.length > 0) {
    lines.push(`\n**Roles (${roles.length}):**`);
    for (const role of roles) {
      const prog = progressions.find((p) => p.roleId === role.id);
      const isLeadership =
        role.overseesStageIds &&
        Array.isArray(role.overseesStageIds) &&
        (role.overseesStageIds as string[]).length > 0;
      const belbin = [role.belbinPrimary, role.belbinSecondary]
        .filter(Boolean)
        .join("/");
      lines.push(
        `- ${role.jobTitle} (${role.id})${isLeadership ? " 👑" : ""} — ${role.corePurpose || "no purpose set"}${belbin ? ` [Belbin: ${belbin}]` : ""}${prog?.tier ? ` (${prog.tier})` : ""}`
      );
    }
  } else {
    lines.push("\n**Roles:** None created yet.");
  }

  // Handoffs
  if (handoffs.length > 0) {
    lines.push(`\n**Handoffs (${handoffs.length}):**`);
    for (const h of handoffs) {
      const from = stages.find((s) => s.id === h.fromStageId)?.name ?? "?";
      const to = stages.find((s) => s.id === h.toStageId)?.name ?? "?";
      lines.push(`- ${from} → ${to}${h.sla ? ` (SLA: ${h.sla})` : " (⚠️ no SLA)"}`);
    }
  }

  // Activities
  if (activities.length > 0) {
    lines.push(`\n**Activities (${activities.length}):**`);
    const grouped = new Map<string, string[]>();
    for (const act of activities) {
      const catName =
        categories.find((c) => c.id === act.categoryId)?.name ?? "Uncategorised";
      if (!grouped.has(catName)) grouped.set(catName, []);
      grouped.get(catName)!.push(act.name);
    }
    for (const [cat, acts] of grouped) {
      lines.push(`- ${cat}: ${acts.slice(0, 5).join(", ")}${acts.length > 5 ? ` +${acts.length - 5} more` : ""}`);
    }
  } else {
    lines.push("\n**Activities:** None defined yet.");
  }

  return lines.join("\n");
}

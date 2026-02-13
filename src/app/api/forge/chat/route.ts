import { streamText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  workspaces,
  stages,
  teamRoles,
  handoffs,
  activities,
  activityCategories,
  activityAssignments,
  stageRoleAssignments,
  roleProgressions,
  forgeConversations,
  forgeMessages,
  orgMembers,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildForgeSystemPrompt, buildWorkspaceContext } from "@/lib/forge";
import { createForgeTools } from "@/lib/forge/tools";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { validateRequest } from "@/lib/validation/middleware";
import { forgeChatRequestSchema } from "@/lib/validation/schemas";

// ════════════════════════════════════════════
// POST /api/forge/chat
// Streaming AI chat with tool calling (AI SDK v6)
// ════════════════════════════════════════════

export async function POST(request: Request) {
  // Rate limiting - Forge is expensive!
  const rateLimitError = await checkRateLimit(request as any, RATE_LIMITS.forge);
  if (rateLimitError) return rateLimitError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Validate request body
  const validation = await validateRequest(request, forgeChatRequestSchema);
  if (!validation.success) {
    return new Response(JSON.stringify({ 
      error: "Invalid request",
      details: validation.response.status === 400 
        ? await validation.response.json() 
        : undefined 
    }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const { messages, workspaceId, conversationId } = validation.data;

  // Verify workspace access
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return new Response("Workspace not found", { status: 404 });
  }

  // Verify org membership
  const [member] = await db
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, workspace.orgId),
        eq(orgMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!member) {
    return new Response("Not a member of this organisation", { status: 403 });
  }

  // Load workspace data for context
  const [wsStages, wsRoles, wsHandoffs, wsActivities, wsCategories] =
    await Promise.all([
      db.select().from(stages).where(eq(stages.workspaceId, workspaceId)),
      db.select().from(teamRoles).where(eq(teamRoles.workspaceId, workspaceId)),
      db.select().from(handoffs).where(eq(handoffs.workspaceId, workspaceId)),
      db
        .select()
        .from(activities)
        .where(eq(activities.workspaceId, workspaceId)),
      db
        .select()
        .from(activityCategories)
        .where(eq(activityCategories.workspaceId, workspaceId)),
    ]);

  // Filter assignments to only workspace-relevant ones
  const roleIds = new Set(wsRoles.map((r) => r.id));
  const stageIds = new Set(wsStages.map((s) => s.id));
  const activityIds = new Set(wsActivities.map((a) => a.id));

  const roleIdList = Array.from(roleIds);
  const stageIdList = Array.from(stageIds);
  const activityIdList = Array.from(activityIds);

  const [wsActivityAssignments, wsStageAssignments, wsProgressions] =
    await Promise.all([
      activityIdList.length && roleIdList.length
        ? db
            .select()
            .from(activityAssignments)
            .where(
              and(
                inArray(activityAssignments.activityId, activityIdList),
                inArray(activityAssignments.roleId, roleIdList)
              )
            )
        : [],
      stageIdList.length && roleIdList.length
        ? db
            .select()
            .from(stageRoleAssignments)
            .where(
              and(
                inArray(stageRoleAssignments.stageId, stageIdList),
                inArray(stageRoleAssignments.roleId, roleIdList)
              )
            )
        : [],
      roleIdList.length
        ? db.query.roleProgressions.findMany({
            where: inArray(roleProgressions.roleId, roleIdList),
          })
        : [],
    ]);

  const filteredStageAssignments = wsStageAssignments.filter(
    (sa) => stageIds.has(sa.stageId) && roleIds.has(sa.roleId)
  );
  const filteredActivityAssignments = wsActivityAssignments.filter(
    (aa) => activityIds.has(aa.activityId) && roleIds.has(aa.roleId)
  );
  const filteredProgressions = wsProgressions.filter((p) =>
    roleIds.has(p.roleId)
  );

  const workspaceContext = buildWorkspaceContext({
    workspaceName: workspace.name,
    stages: wsStages,
    roles: wsRoles,
    handoffs: wsHandoffs,
    activities: wsActivities,
    categories: wsCategories,
    stageAssignments: filteredStageAssignments,
    progressions: filteredProgressions,
  });

  const systemPrompt = buildForgeSystemPrompt(workspaceContext);

  // Save user message to DB
  let convoId = conversationId;
  if (!convoId) {
    const [convo] = await db
      .insert(forgeConversations)
      .values({
        workspaceId,
        userId: user.id,
        title:
          messages[messages.length - 1]?.content?.slice(0, 80) ??
          "New conversation",
      })
      .returning();
    convoId = convo.id;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await db.insert(forgeMessages).values({
      conversationId: convoId,
      role: "user",
      content: lastMessage.content,
    });
  }

  // Workspace data for tool execution
  const wsData = {
    workspaceId,
    roles: wsRoles,
    stages: wsStages,
    handoffs: wsHandoffs,
    activities: wsActivities,
    activityAssignments: filteredActivityAssignments,
    categories: wsCategories,
    stageAssignments: filteredStageAssignments,
    progressions: filteredProgressions,
  };

  // Create tools with workspace context baked in
  const tools = createForgeTools(workspaceId, wsData);

  const result = streamText({
    model: google(process.env.GEMINI_MODEL || "gemini-2.0-flash"),
    system: systemPrompt,
    messages: messages
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async (event) => {
      // Save assistant response
      if (convoId && event.text) {
        await db.insert(forgeMessages).values({
          conversationId: convoId,
          role: "assistant",
          content: event.text,
        });
      }
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "X-Forge-Conversation-Id": convoId!,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workspaces,
  stages,
  teamRoles,
  handoffs,
  activityCategories,
  activities,
  activityAssignments,
  stageRoleAssignments,
  roleProgressions,
} from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { validateRequest } from "@/lib/validation/middleware";
import { updateWorkspaceSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit/logger";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/workspaces/:id — get workspace with all data
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Rate limiting for expensive read operations
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.expensiveRead);
    if (rateLimitError) return rateLimitError;

    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(id, auth.user.id, "viewer");
    if ("response" in access) return access.response!;

    const workspace = access.workspace;

    // Fetch all workspace data in parallel
    const [
      stageList,
      roleList,
      handoffList,
      categoryList,
      activityList,
    ] = await Promise.all([
      db.query.stages.findMany({
        where: eq(stages.workspaceId, id),
        orderBy: (s, { asc }) => [asc(s.sortOrder)],
      }),
      db.query.teamRoles.findMany({
        where: eq(teamRoles.workspaceId, id),
      }),
      db.query.handoffs.findMany({
        where: eq(handoffs.workspaceId, id),
      }),
      db.query.activityCategories.findMany({
        where: eq(activityCategories.workspaceId, id),
        orderBy: (c, { asc }) => [asc(c.sortOrder)],
      }),
      db.query.activities.findMany({
        where: eq(activities.workspaceId, id),
      }),
    ]);

    // Filter junction tables to this workspace's entities
    const stageIds = new Set(stageList.map((s) => s.id));
    const roleIds = new Set(roleList.map((r) => r.id));
    const activityIds = new Set(activityList.map((a) => a.id));

    const stageIdList = Array.from(stageIds);
    const roleIdList = Array.from(roleIds);
    const activityIdList = Array.from(activityIds);

    const [assignmentList, stageAssignmentList, progressionList] =
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

    const filteredStageAssignments = stageAssignmentList.filter(
      (sa) => stageIds.has(sa.stageId) && roleIds.has(sa.roleId)
    );
    const filteredActivityAssignments = assignmentList.filter(
      (aa) => activityIds.has(aa.activityId) && roleIds.has(aa.roleId)
    );
    const filteredProgressions = progressionList.filter((p) =>
      roleIds.has(p.roleId)
    );

    return NextResponse.json({
      workspace,
      stages: stageList,
      roles: roleList,
      handoffs: handoffList,
      categories: categoryList,
      activities: activityList,
      activityAssignments: filteredActivityAssignments,
      stageAssignments: filteredStageAssignments,
      progressions: filteredProgressions,
    });
  } catch (error) {
    console.error("Get workspace error:", error);
    return NextResponse.json(
      { error: "Failed to load workspace" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/:id — update workspace
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Rate limiting for write operations
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.write);
    if (rateLimitError) return rateLimitError;

    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(id, auth.user.id, "editor");
    if ("response" in access) return access.response!;

    // Input validation
    const validation = await validateRequest(request, updateWorkspaceSchema);
    if (!validation.success) return validation.response;
    const updates = validation.data;

    // Capture old state for audit
    const oldWorkspace = access.workspace;

    // Perform update
    const [updated] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();

    // Audit log
    await createAuditLog({
      action: "workspace.updated",
      userId: auth.user.id,
      userEmail: auth.user.email,
      orgId: oldWorkspace.orgId,
      workspaceId: id,
      resourceType: "workspace",
      resourceId: id,
      previousState: oldWorkspace as unknown as Record<string, unknown>,
      newState: updated as unknown as Record<string, unknown>,
      metadata: { fieldsChanged: Object.keys(updates) },
      request,
    });

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error("Update workspace error:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/:id — delete workspace (cascades)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Rate limiting for write operations
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.write);
    if (rateLimitError) return rateLimitError;

    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(id, auth.user.id, "admin");
    if ("response" in access) return access.response!;

    // Capture state before deletion
    const workspace = access.workspace;

    await db.delete(workspaces).where(eq(workspaces.id, id));

    // Audit log
    await createAuditLog({
      action: "workspace.deleted",
      userId: auth.user.id,
      userEmail: auth.user.email,
      orgId: workspace.orgId,
      workspaceId: id,
      resourceType: "workspace",
      resourceId: id,
      previousState: workspace as unknown as Record<string, unknown>,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}

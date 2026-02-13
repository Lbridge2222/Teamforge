import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stageRoleAssignments, stages, teamRoles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { assignStageRoleSchema } from "@/lib/validation/schemas";
import { logger, handleApiError, errors } from "@/lib/errors";

// POST /api/stages/:stageId/assign — assign role to stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  const requestId = crypto.randomUUID();
  let auth: Awaited<ReturnType<typeof requireUser>> | undefined;
  
  try {
    auth = await requireUser();
    if (!auth.user) return auth.response!;

    const stage = await db.query.stages.findFirst({
      where: eq(stages.id, stageId),
    });

    if (!stage) {
      throw errors.notFound("Stage");
    }

    const access = await requireWorkspaceAccess(
      stage.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const body = await request.json();
    const validationResult = assignStageRoleSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw errors.validation("Invalid assignment data", {
        errors: validationResult.error.issues,
      });
    }

    const { roleId, sortOrder } = validationResult.data;

    // Verify role exists and belongs to same workspace
    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
    });

    if (!role) {
      throw errors.notFound("Role");
    }

    if (role.workspaceId !== stage.workspaceId) {
      throw errors.validation("Role must belong to the same workspace");
    }

    // Check if already assigned
    const existing = await db.query.stageRoleAssignments.findFirst({
      where: and(
        eq(stageRoleAssignments.stageId, stageId),
        eq(stageRoleAssignments.roleId, roleId)
      ),
    });

    if (existing) {
      logger.info("Role already assigned to stage", {
        userId: auth.user.id,
        workspaceId: stage.workspaceId,
        stageId,
        roleId,
        requestId,
      });
      return NextResponse.json({ assignment: existing });
    }

    const [assignment] = await db
      .insert(stageRoleAssignments)
      .values({ stageId, roleId, sortOrder: sortOrder ?? 0 })
      .returning();
    
    logger.info("Role assigned to stage", {
      userId: auth.user.id,
      workspaceId: stage.workspaceId,
      stageId,
      roleId,
      assignmentId: assignment.id,
      requestId,
    });
    
    return NextResponse.json({ assignment });
  } catch (error) {
    const errorResponse = handleApiError(error, {
      userId: auth?.user?.id,
      stageId,
      requestId,
    });
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.status }
    );
  }
}

// DELETE /api/stages/:stageId/assign — unassign role from stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const stage = await db.query.stages.findFirst({
      where: eq(stages.id, stageId),
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const access = await requireWorkspaceAccess(
      stage.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const { roleId } = await request.json();

    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
    });

    if (!role || role.workspaceId !== stage.workspaceId) {
      return NextResponse.json(
        { error: "Role not found in this workspace" },
        { status: 404 }
      );
    }

    await db
      .delete(stageRoleAssignments)
      .where(
        and(
          eq(stageRoleAssignments.stageId, stageId),
          eq(stageRoleAssignments.roleId, roleId)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unassign role error:", error);
    return NextResponse.json({ error: "Failed to unassign role" }, { status: 500 });
  }
}

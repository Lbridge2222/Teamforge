import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  activities,
  activityAssignments,
  activityCategories,
  stages,
  teamRoles,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/activities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(
      workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const body = await request.json();
    const { assignments: roleIds, ...activityData } = body;
    const {
      id: _id,
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeActivityData
    } = activityData ?? {};

    if (safeActivityData.categoryId) {
      const category = await db.query.activityCategories.findFirst({
        where: eq(activityCategories.id, safeActivityData.categoryId),
      });

      if (!category || category.workspaceId !== workspaceId) {
        return NextResponse.json(
          { error: "Category not found in this workspace" },
          { status: 400 }
        );
      }
    }

    if (safeActivityData.stageId) {
      const stage = await db.query.stages.findFirst({
        where: eq(stages.id, safeActivityData.stageId),
      });

      if (!stage || stage.workspaceId !== workspaceId) {
        return NextResponse.json(
          { error: "Stage not found in this workspace" },
          { status: 400 }
        );
      }
    }

    if (roleIds !== undefined) {
      if (!Array.isArray(roleIds)) {
        return NextResponse.json(
          { error: "assignments must be an array of role IDs" },
          { status: 400 }
        );
      }

      if (roleIds.length > 0) {
        const roles = await db.query.teamRoles.findMany({
          where: inArray(teamRoles.id, roleIds),
        });

        const allRolesValid =
          roles.length === roleIds.length &&
          roles.every((role) => role.workspaceId === workspaceId);

        if (!allRolesValid) {
          return NextResponse.json(
            { error: "Assignments include roles outside this workspace" },
            { status: 400 }
          );
        }
      }
    }

    const [activity] = await db
      .insert(activities)
      .values({ ...safeActivityData, workspaceId })
      .returning();

    // Create assignments if provided
    if (roleIds && roleIds.length > 0) {
      await db.insert(activityAssignments).values(
        roleIds.map((roleId: string) => ({
          activityId: activity.id,
          roleId,
        }))
      );
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Create activity error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

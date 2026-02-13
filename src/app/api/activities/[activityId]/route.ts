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

type RouteParams = { params: Promise<{ activityId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { activityId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const activity = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      activity.workspaceId,
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

      if (!category || category.workspaceId !== activity.workspaceId) {
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

      if (!stage || stage.workspaceId !== activity.workspaceId) {
        return NextResponse.json(
          { error: "Stage not found in this workspace" },
          { status: 400 }
        );
      }
    }

    // Update activity fields
    if (Object.keys(safeActivityData).length > 0) {
      await db
        .update(activities)
        .set({ ...safeActivityData, updatedAt: new Date() })
        .where(eq(activities.id, activityId));
    }

    // Replace assignments if provided (delete-all-then-insert pattern)
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
          roles.every((role) => role.workspaceId === activity.workspaceId);

        if (!allRolesValid) {
          return NextResponse.json(
            { error: "Assignments include roles outside this workspace" },
            { status: 400 }
          );
        }
      }

      await db
        .delete(activityAssignments)
        .where(eq(activityAssignments.activityId, activityId));

      if (roleIds.length > 0) {
        await db.insert(activityAssignments).values(
          roleIds.map((roleId: string) => ({
            activityId,
            roleId,
          }))
        );
      }
    }

    const updated = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
    });

    return NextResponse.json({ activity: updated });
  } catch (error) {
    console.error("Update activity error:", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { activityId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const activity = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      activity.workspaceId,
      auth.user.id,
      "admin"
    );
    if ("response" in access) return access.response!;

    await db.delete(activities).where(eq(activities.id, activityId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete activity error:", error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
  }
}

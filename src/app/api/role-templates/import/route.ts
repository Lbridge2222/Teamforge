import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  roleTemplates,
  teamRoles,
  activityCategories,
  activities,
  activityAssignments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/role-templates/import — import one or more role templates into a workspace
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const { workspaceId, templateIds } = (await request.json()) as {
      workspaceId: string;
      templateIds: string[];
    };

    if (!workspaceId || !templateIds?.length) {
      return NextResponse.json(
        { error: "workspaceId and templateIds[] are required" },
        { status: 400 }
      );
    }

    const access = await requireWorkspaceAccess(
      workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const imported: Array<{
      roleId: string;
      jobTitle: string;
      activitiesCreated: number;
    }> = [];

    for (const templateId of templateIds) {
      // Fetch template
      const [template] = await db
        .select()
        .from(roleTemplates)
        .where(eq(roleTemplates.id, templateId))
        .limit(1);
      if (!template) continue;

      // Create the team role
      const [role] = await db
        .insert(teamRoles)
        .values({
          workspaceId,
          name: template.jobTitle,
          jobTitle: template.jobTitle,
          colorIndex: Math.floor(Math.random() * 8),
          corePurpose: template.corePurpose,
          keyDeliverables: template.keyDeliverables ?? [],
          strengthProfile: template.strengthProfile ?? [],
          belbinPrimary: template.belbinPrimary,
          belbinSecondary: template.belbinSecondary,
          budgetLevel: template.budgetLevel ?? "none",
        })
        .returning();

      let activitiesCreated = 0;

      // Create activity categories + activities
      if (template.activities && Array.isArray(template.activities)) {
        for (const catDef of template.activities) {
          // Find or create category
          const [category] = await db
            .select()
            .from(activityCategories)
            .where(
              and(
                eq(activityCategories.workspaceId, workspaceId),
                eq(activityCategories.name, catDef.category)
              )
            )
            .limit(1);

          let finalCategory = category;
          if (!finalCategory) {
            const existing = await db
              .select()
              .from(activityCategories)
              .where(eq(activityCategories.workspaceId, workspaceId));
            [finalCategory] = await db
              .insert(activityCategories)
              .values({
                workspaceId,
                name: catDef.category,
                sortOrder: existing.length,
              })
              .returning();
          }

          // Create activities and assign to role
          for (const activityName of catDef.items) {
            // Check if activity already exists in this category
            const [existingActivity] = await db
              .select()
              .from(activities)
              .where(
                and(
                  eq(activities.workspaceId, workspaceId),
                  eq(activities.categoryId, finalCategory.id),
                  eq(activities.name, activityName)
                )
              )
              .limit(1);

            let existing = existingActivity;

            if (!existing) {
              [existing] = await db
                .insert(activities)
                .values({
                  workspaceId,
                  name: activityName,
                  categoryId: finalCategory.id,
                })
                .returning();
              activitiesCreated++;
            }

            // Assign activity to role (ignore if already assigned)
            try {
              await db.insert(activityAssignments).values({
                activityId: existing!.id,
                roleId: role.id,
              });
            } catch {
              // Duplicate assignment, ignore
            }
          }
        }
      }

      imported.push({
        roleId: role.id,
        jobTitle: role.jobTitle,
        activitiesCreated,
      });
    }

    return NextResponse.json({ imported });
  } catch (error) {
    console.error("Import role template error:", error);
    return NextResponse.json(
      { error: "Failed to import role templates" },
      { status: 500 }
    );
  }
}

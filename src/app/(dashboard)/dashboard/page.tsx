import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  workspaces,
  orgMembers,
  organisations,
  teamRoles,
  stages,
  stageRoleAssignments,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import type { OrgChartSummary } from "@/components/shared/MiniOrgChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's organisation
  const membership = await db.query.orgMembers.findFirst({
    where: eq(orgMembers.userId, user.id),
    with: { organisation: true },
  });

  if (!membership) {
    // User has no org — create one automatically
    const orgName = `${user.email?.split("@")[0]}'s Organisation`;
    const slug = `${orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${Date.now()}`;
    
    try {
      const [org] = await db
        .insert(organisations)
        .values({ name: orgName, slug })
        .returning();

      await db.insert(orgMembers).values({
        orgId: org.id,
        userId: user.id,
        role: "owner",
      });
    } catch {
      // Org may already exist from a race condition - try to find it
      const existingMembership = await db.query.orgMembers.findFirst({
        where: eq(orgMembers.userId, user.id),
        with: { organisation: true },
      });
      if (!existingMembership) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-4">Setup Error</h1>
              <p className="text-gray-600 mb-4">Failed to set up your organisation.</p>
              <a href="/login" className="text-blue-600 hover:underline">Try logging in again</a>
            </div>
          </div>
        );
      }
    }

    // Redirect to reload with new org
    redirect("/dashboard");
  }

  // Get workspaces for this org
  const orgWorkspaces = await db.query.workspaces.findMany({
    where: eq(workspaces.orgId, membership.orgId),
    orderBy: (w, { desc }) => [desc(w.updatedAt)],
  });

  // Build org chart summaries for each workspace
  const summaries: Record<string, OrgChartSummary> = {};

  for (const ws of orgWorkspaces) {
    // Get all roles
    const wsRoles = await db
      .select({ id: teamRoles.id, overseesStageIds: teamRoles.overseesStageIds })
      .from(teamRoles)
      .where(eq(teamRoles.workspaceId, ws.id));

    // Get all stages ordered
    const wsStages = await db
      .select({ id: stages.id, name: stages.name, sortOrder: stages.sortOrder })
      .from(stages)
      .where(eq(stages.workspaceId, ws.id))
      .orderBy(stages.sortOrder);

    // Get all assignments
    const wsAssignments = await db
      .select({ stageId: stageRoleAssignments.stageId, roleId: stageRoleAssignments.roleId })
      .from(stageRoleAssignments)
      .where(
        sql`${stageRoleAssignments.stageId} IN (SELECT id FROM stages WHERE workspace_id = ${ws.id})`
      );

    const assignedRoleIds = new Set(wsAssignments.map((a) => a.roleId));
    const leadershipRoleIds = new Set(
      wsRoles
        .filter(
          (r) =>
            r.overseesStageIds &&
            Array.isArray(r.overseesStageIds) &&
            (r.overseesStageIds as string[]).length > 0
        )
        .map((r) => r.id)
    );

    const stageRoleCounts = new Map<string, number>();
    for (const a of wsAssignments) {
      stageRoleCounts.set(a.stageId, (stageRoleCounts.get(a.stageId) ?? 0) + 1);
    }

    summaries[ws.id] = {
      leadershipCount: leadershipRoleIds.size,
      stages: wsStages.map((s) => ({
        name: s.name,
        roleCount: stageRoleCounts.get(s.id) ?? 0,
      })),
      unassignedCount: wsRoles.filter(
        (r) => !assignedRoleIds.has(r.id) && !leadershipRoleIds.has(r.id)
      ).length,
      totalRoles: wsRoles.length,
    };
  }

  return (
    <DashboardClient
      orgName={membership.organisation.name}
      orgId={membership.orgId}
      workspaces={orgWorkspaces}
      userRole={membership.role}
      summaries={summaries}
    />
  );
}

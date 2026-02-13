import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orgMembers, workspaces } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { OrgRole } from "@/lib/types";

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function hasOrgRole(actual: OrgRole, required: OrgRole) {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { user, supabase } as const;
}

export async function requireOrgAccess(
  orgId: string,
  userId: string,
  requiredRole: OrgRole = "viewer"
) {
  const membership = await db.query.orgMembers.findFirst({
    where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)),
  });

  if (!membership) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  if (!hasOrgRole(membership.role, requiredRole)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { membership } as const;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requiredRole: OrgRole = "viewer"
) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    return {
      response: NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      ),
    } as const;
  }

  const orgAccess = await requireOrgAccess(
    workspace.orgId,
    userId,
    requiredRole
  );

  if ("response" in orgAccess) {
    return { response: orgAccess.response } as const;
  }

  return { workspace, membership: orgAccess.membership } as const;
}

// ════════════════════════════════════════════
// EXAMPLE: Refactored API Route
// Shows how to use all new infrastructure together
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teamRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";
import { validateRequest } from "@/lib/validation/middleware";
import { createRoleSchema, updateRoleSchema } from "@/lib/validation/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { createAuditLog } from "@/lib/audit/logger";

type RouteParams = { params: Promise<{ roleId: string }> };

// ════════════════════════════════════════════
// GET /api/roles/[roleId] - Get single role
// ════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { roleId } = await params;

  try {
    // 1. Rate limiting
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.api);
    if (rateLimitError) return rateLimitError;

    // 2. Authentication
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    // 3. Fetch role
    const role = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // 4. Authorization (workspace-level)
    const access = await requireWorkspaceAccess(
      role.workspaceId,
      auth.user.id,
      "viewer"
    );
    if ("response" in access) return access.response;

    // 5. Return data
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Get role error:", error);
    return NextResponse.json(
      { error: "Failed to load role" },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════
// PUT /api/roles/[roleId] - Update role
// ════════════════════════════════════════════

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { roleId } = await params;

  try {
    // 1. Rate limiting (stricter for write operations)
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.write);
    if (rateLimitError) return rateLimitError;

    // 2. Authentication
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    // 3. Input validation
    const validation = await validateRequest(request, updateRoleSchema);
    if (!validation.success) return validation.response;
    const updates = validation.data;

    // 4. Fetch existing role (for audit trail)
    const existingRole = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // 5. Authorization (require editor role)
    const access = await requireWorkspaceAccess(
      existingRole.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response;

    // 6. Perform update
    const [updatedRole] = await db
      .update(teamRoles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(teamRoles.id, roleId))
      .returning();

    // 7. Audit logging
    await createAuditLog({
      action: "role.updated",
      userId: auth.user.id,
      userEmail: auth.user.email,
      orgId: access.workspace.orgId,
      workspaceId: existingRole.workspaceId,
      resourceType: "role",
      resourceId: roleId,
      previousState: existingRole as Record<string, unknown>,
      newState: updatedRole as Record<string, unknown>,
      metadata: {
        fieldsChanged: Object.keys(updates),
      },
      request,
    });

    // 8. Return success
    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════
// DELETE /api/roles/[roleId] - Delete role
// ════════════════════════════════════════════

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { roleId } = await params;

  try {
    // 1. Rate limiting
    const rateLimitError = await checkRateLimit(request, RATE_LIMITS.write);
    if (rateLimitError) return rateLimitError;

    // 2. Authentication
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    // 3. Fetch existing role
    const existingRole = await db.query.teamRoles.findFirst({
      where: eq(teamRoles.id, roleId),
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // 4. Authorization (require editor role)
    const access = await requireWorkspaceAccess(
      existingRole.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response;

    // 5. Soft delete check (if you want to keep historical data)
    // OR hard delete (cascades to assignments via DB constraints)
    await db.delete(teamRoles).where(eq(teamRoles.id, roleId));

    // 6. Audit logging
    await createAuditLog({
      action: "role.deleted",
      userId: auth.user.id,
      userEmail: auth.user.email,
      orgId: access.workspace.orgId,
      workspaceId: existingRole.workspaceId,
      resourceType: "role",
      resourceId: roleId,
      previousState: existingRole as Record<string, unknown>,
      request,
    });

    // 7. Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════
// COMPARISON: Before vs After
// ════════════════════════════════════════════

/*

BEFORE (src/app/api/roles/[roleId]/route.ts):
❌ No rate limiting
❌ No input validation
❌ No audit logging
❌ Inconsistent error handling
❌ Direct updates without previous state capture

AFTER (this example):
✅ Rate limiting on all operations
✅ Input validation with Zod schemas
✅ Comprehensive audit logging
✅ Consistent error handling
✅ Security-first approach
✅ Full audit trail with before/after states

*/

// ════════════════════════════════════════════
// TESTING THIS ROUTE
// ════════════════════════════════════════════

/*

// Test 1: Unauthorized access
fetch('/api/roles/role-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Role' })
});
// Expected: 401 Unauthorized

// Test 2: Invalid input
fetch('/api/roles/role-id', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer valid-token'
  },
  body: JSON.stringify({ 
    name: '', // Empty string should fail validation
    jobTitle: 'x'.repeat(200) // Too long
  })
});
// Expected: 400 Bad Request with validation errors

// Test 3: Rate limiting
for (let i = 0; i < 35; i++) {
  fetch('/api/roles/role-id', {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-token'
    },
    body: JSON.stringify({ name: 'Test' + i })
  });
}
// Expected: 429 Too Many Requests after 30 requests

// Test 4: Cross-tenant access attempt
const roleInOrgA = 'role-from-org-a';
const tokenForOrgB = 'token-for-user-in-org-b';

fetch(`/api/roles/${roleInOrgA}`, {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenForOrgB}`
  },
  body: JSON.stringify({ name: 'Hacked' })
});
// Expected: 403 Forbidden

// Test 5: Audit log verification
// After successful update, check audit_logs table:
SELECT * FROM audit_logs 
WHERE resource_id = 'role-id' 
  AND action = 'role.updated'
ORDER BY created_at DESC LIMIT 1;
// Should show: user, timestamp, before/after state

*/

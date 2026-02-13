// ════════════════════════════════════════════
// Audit Logger Service
// Centralized audit logging for all CRUD operations
// ════════════════════════════════════════════

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { NextRequest } from "next/server";

export type AuditAction =
  | "workspace.created"
  | "workspace.updated"
  | "workspace.deleted"
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "stage.created"
  | "stage.updated"
  | "stage.deleted"
  | "stage.role_assigned"
  | "stage.role_unassigned"
  | "handoff.created"
  | "handoff.updated"
  | "handoff.deleted"
  | "activity.created"
  | "activity.updated"
  | "activity.deleted"
  | "activity.assigned"
  | "activity.unassigned"
  | "activity_category.created"
  | "activity_category.updated"
  | "activity_category.deleted"
  | "progression.created"
  | "progression.updated"
  | "progression.deleted"
  | "org.created"
  | "org.updated"
  | "org.member_invited"
  | "org.member_removed"
  | "org.member_role_changed"
  | "auth.login"
  | "auth.logout"
  | "auth.failed_login"
  | "billing.plan_changed"
  | "billing.payment_succeeded"
  | "billing.payment_failed";

interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  orgId?: string;
  workspaceId?: string;
  resourceType?: string;
  resourceId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  request?: NextRequest | Request;
}

/**
 * Creates an audit log entry
 * Call this after every significant state change
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const {
      action,
      userId,
      userEmail,
      orgId,
      workspaceId,
      resourceType,
      resourceId,
      previousState,
      newState,
      metadata,
      request,
    } = params;

    // Extract request context if available
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      // Get IP address from various headers (handles proxies)
      ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        undefined;

      userAgent = request.headers.get("user-agent") || undefined;
    }

    await db.insert(auditLogs).values({
      action,
      userId: userId || null,
      userEmail: userEmail || null,
      orgId: orgId || null,
      workspaceId: workspaceId || null,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      previousState: previousState || null,
      newState: newState || null,
      metadata: metadata || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (error) {
    // Don't let audit logging failures break the main operation
    // But log it for monitoring
    console.error("Failed to create audit log:", error);
    
    // In production, you'd send this to a monitoring service
    // e.g., Sentry, DataDog, etc.
  }
}

/**
 * Query audit logs for a specific organization
 * Used for compliance and security investigations
 */
export async function getOrgAuditLogs(
  orgId: string,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    workspaceId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const { limit = 100, offset = 0, userId, workspaceId, action, startDate, endDate } = options || {};

  const conditions = [eq(auditLogs.orgId, orgId)];

  if (userId) {
    conditions.push(eq(auditLogs.userId, userId));
  }

  if (workspaceId) {
    conditions.push(eq(auditLogs.workspaceId, workspaceId));
  }

  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }

  if (startDate) {
    conditions.push(gte(auditLogs.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(auditLogs.createdAt, endDate));
  }

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get audit trail for a specific resource
 * Shows complete change history
 */
export async function getResourceAuditTrail(
  resourceType: string,
  resourceId: string,
  limit: number = 50
) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.resourceType, resourceType),
        eq(auditLogs.resourceId, resourceId)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

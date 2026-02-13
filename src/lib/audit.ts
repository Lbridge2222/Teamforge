// ════════════════════════════════════════════
// Audit Service — Log important operations
// ════════════════════════════════════════════

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { logger } from "@/lib/errors";

type NewAuditLog = typeof auditLogs.$inferInsert;

export type AuditAction =
  // Workspace
  | "workspace.create"
  | "workspace.update"
  | "workspace.delete"
  // Roles
  | "role.create"
  | "role.update"
  | "role.delete"
  | "role.assign"
  | "role.unassign"
  // Stages
  | "stage.create"
  | "stage.update"
  | "stage.delete"
  // Activities
  | "activity.create"
  | "activity.update"
  | "activity.delete"
  | "activity.assign"
  // Access control
  | "access.granted"
  | "access.revoked"
  | "access.denied";

export type AuditContext = {
  userId: string;
  orgId?: string;
  workspaceId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditPayload = {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Audit service for logging important operations
 */
class AuditService {
  private enabled = process.env.ENABLE_AUDIT_LOG !== "false";

  /**
   * Log an audit event
   */
  async log(context: AuditContext, payload: AuditPayload): Promise<void> {
    if (!this.enabled) {
      logger.debug("Audit logging disabled, skipping", { context, payload });
      return;
    }

    try {
      const logEntry: NewAuditLog = {
        userId: context.userId,
        orgId: context.orgId,
        workspaceId: context.workspaceId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: payload.action as any,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        previousState: payload.before,
        newState: payload.after,
        metadata: { ...payload.metadata, requestId: context.requestId },
      };

      await db.insert(auditLogs).values(logEntry);

      logger.info("Audit log recorded", {
        action: payload.action,
        resourceType: payload.resourceType,
        userId: context.userId,
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      logger.error("Failed to write audit log", error as Error, {
        context,
        payload,
      });
    }
  }

  /**
   * Convenience method for role operations
   */
  async logRoleChange(
    context: AuditContext,
    action: Extract<
      AuditAction,
      "role.create" | "role.update" | "role.delete"
    >,
    roleId: string,
    before?: Record<string, unknown>,
    after?: Record<string, unknown>
  ): Promise<void> {
    await this.log(context, {
      action,
      resourceType: "role",
      resourceId: roleId,
      before,
      after,
    });
  }

  /**
   * Convenience method for workspace operations
   */
  async logWorkspaceChange(
    context: AuditContext,
    action: Extract<
      AuditAction,
      "workspace.create" | "workspace.update" | "workspace.delete"
    >,
    workspaceId: string,
    before?: Record<string, unknown>,
    after?: Record<string, unknown>
  ): Promise<void> {
    await this.log(context, {
      action,
      resourceType: "workspace",
      resourceId: workspaceId,
      before,
      after,
    });
  }

  /**
   * Log access control events
   */
  async logAccess(
    context: AuditContext,
    action: Extract<
      AuditAction,
      "access.granted" | "access.revoked" | "access.denied"
    >,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(context, {
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }
}

export const auditService = new AuditService();

/**
 * Helper to extract audit context from a Next.js request
 */
export function getAuditContextFromRequest(
  request: Request,
  userId: string,
  orgId?: string,
  workspaceId?: string
): AuditContext {
  return {
    userId,
    orgId,
    workspaceId,
    requestId: crypto.randomUUID(),
    ipAddress: request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}

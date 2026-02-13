// ════════════════════════════════════════════
// Audit Log Schema
// Add this to your schema.ts file
// ════════════════════════════════════════════

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organisations, workspaces } from "./schema";

// Enum for audit event types
export const auditActionEnum = pgEnum("audit_action", [
  // Workspace operations
  "workspace.created",
  "workspace.updated",
  "workspace.deleted",
  
  // Role operations
  "role.created",
  "role.updated",
  "role.deleted",
  
  // Stage operations
  "stage.created",
  "stage.updated",
  "stage.deleted",
  "stage.role_assigned",
  "stage.role_unassigned",
  
  // Handoff operations
  "handoff.created",
  "handoff.updated",
  "handoff.deleted",
  
  // Activity operations
  "activity.created",
  "activity.updated",
  "activity.deleted",
  "activity.assigned",
  "activity.unassigned",
  "activity_category.created",
  "activity_category.updated",
  "activity_category.deleted",
  
  // Progression operations
  "progression.created",
  "progression.updated",
  "progression.deleted",
  
  // Org operations
  "org.created",
  "org.updated",
  "org.member_invited",
  "org.member_removed",
  "org.member_role_changed",
  
  // Auth operations
  "auth.login",
  "auth.logout",
  "auth.failed_login",
  
  // Billing operations
  "billing.plan_changed",
  "billing.payment_succeeded",
  "billing.payment_failed",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Who performed the action
    userId: uuid("user_id"),
    userEmail: text("user_email"),
    
    // What organization (for tenant filtering)
    orgId: uuid("org_id").references(() => organisations.id, { onDelete: "set null" }),
    
    // What workspace (optional)
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    
    // Action details
    action: auditActionEnum("action").notNull(),
    
    // Resource affected
    resourceType: text("resource_type"), // e.g., "role", "stage", "workspace"
    resourceId: uuid("resource_id"),
    
    // Previous and new state (for updates)
    previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
    newState: jsonb("new_state").$type<Record<string, unknown>>(),
    
    // Additional context
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    
    // Request context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_audit_logs_org").on(table.orgId, table.createdAt),
    index("idx_audit_logs_workspace").on(table.workspaceId, table.createdAt),
    index("idx_audit_logs_user").on(table.userId, table.createdAt),
    index("idx_audit_logs_resource").on(table.resourceType, table.resourceId),
    index("idx_audit_logs_action").on(table.action, table.createdAt),
  ]
);

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organisation: one(organisations, {
    fields: [auditLogs.orgId],
    references: [organisations.id],
  }),
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
  }),
}));

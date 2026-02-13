CREATE TYPE "public"."audit_action" AS ENUM('workspace.created', 'workspace.updated', 'workspace.deleted', 'role.created', 'role.updated', 'role.deleted', 'stage.created', 'stage.updated', 'stage.deleted', 'stage.role_assigned', 'stage.role_unassigned', 'handoff.created', 'handoff.updated', 'handoff.deleted', 'activity.created', 'activity.updated', 'activity.deleted', 'activity.assigned', 'activity.unassigned', 'activity_category.created', 'activity_category.updated', 'activity_category.deleted', 'progression.created', 'progression.updated', 'progression.deleted', 'org.created', 'org.updated', 'org.member_invited', 'org.member_removed', 'org.member_role_changed', 'auth.login', 'auth.logout', 'auth.failed_login', 'billing.plan_changed', 'billing.payment_succeeded', 'billing.payment_failed');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"org_id" uuid,
	"workspace_id" uuid,
	"action" "audit_action" NOT NULL,
	"resource_type" text,
	"resource_id" uuid,
	"previous_state" jsonb,
	"new_state" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_org" ON "audit_logs" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_workspace" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action","created_at");
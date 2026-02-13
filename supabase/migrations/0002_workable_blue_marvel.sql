CREATE TYPE "public"."clarity_session_status" AS ENUM('draft', 'analyzing', 'compared', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'accepted', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."proposal_type" AS ENUM('edit_role', 'add_ownership', 'remove_ownership', 'add_deliverable', 'remove_deliverable', 'set_boundary', 'add_handoff_sla', 'update_handoff_sla', 'resolve_overlap');--> statement-breakpoint
CREATE TABLE "clarity_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"proposal_id" uuid,
	"user_id" uuid NOT NULL,
	"user_email" text,
	"content" text NOT NULL,
	"is_approval" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clarity_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "proposal_type" NOT NULL,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"target_role_id" uuid,
	"target_handoff_id" uuid,
	"field" text,
	"current_value" jsonb,
	"proposed_value" jsonb,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"impact" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clarity_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid,
	"status" "clarity_session_status" DEFAULT 'draft' NOT NULL,
	"input_type" text NOT NULL,
	"input_text" text,
	"input_url" text,
	"extracted_title" text,
	"extracted_purpose" text,
	"extracted_responsibilities" jsonb DEFAULT '[]'::jsonb,
	"extracted_deliverables" jsonb DEFAULT '[]'::jsonb,
	"extracted_ownership_domains" jsonb DEFAULT '[]'::jsonb,
	"extracted_does_not_own" jsonb DEFAULT '[]'::jsonb,
	"extracted_skills" jsonb DEFAULT '[]'::jsonb,
	"extracted_tier" text,
	"comparison_summary" text,
	"gap_analysis" jsonb DEFAULT '[]'::jsonb,
	"overlap_analysis" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clarity_comments" ADD CONSTRAINT "clarity_comments_session_id_clarity_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."clarity_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_comments" ADD CONSTRAINT "clarity_comments_proposal_id_clarity_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."clarity_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_proposals" ADD CONSTRAINT "clarity_proposals_session_id_clarity_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."clarity_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_proposals" ADD CONSTRAINT "clarity_proposals_target_role_id_team_roles_id_fk" FOREIGN KEY ("target_role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_proposals" ADD CONSTRAINT "clarity_proposals_target_handoff_id_handoffs_id_fk" FOREIGN KEY ("target_handoff_id") REFERENCES "public"."handoffs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_sessions" ADD CONSTRAINT "clarity_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarity_sessions" ADD CONSTRAINT "clarity_sessions_role_id_team_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."team_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clarity_comments_session" ON "clarity_comments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_comments_proposal" ON "clarity_comments" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_proposals_session" ON "clarity_proposals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_proposals_role" ON "clarity_proposals" USING btree ("target_role_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_sessions_workspace" ON "clarity_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_sessions_role" ON "clarity_sessions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_clarity_sessions_user" ON "clarity_sessions" USING btree ("user_id");
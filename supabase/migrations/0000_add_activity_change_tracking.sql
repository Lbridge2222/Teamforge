CREATE TYPE "public"."autonomy_level" AS ENUM('low', 'moderate', 'high', 'full');--> statement-breakpoint
CREATE TYPE "public"."budget_level" AS ENUM('owner', 'manager', 'awareness', 'none');--> statement-breakpoint
CREATE TYPE "public"."forge_message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."growth_track" AS ENUM('steep', 'steady', 'either');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('entry', 'mid', 'senior', 'lead', 'head', 'director');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"stage_id" uuid,
	"notes" text,
	"pre_change_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "activity_role_unique" UNIQUE("activity_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"belbin_ideal" jsonb DEFAULT '[]'::jsonb,
	"belbin_fit_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "forge_message_role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"from_stage_id" uuid NOT NULL,
	"to_stage_id" uuid NOT NULL,
	"notes" text,
	"tensions" jsonb DEFAULT '[]'::jsonb,
	"sla" text,
	"sla_owner" text,
	"data_handoff" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"invited_email" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_user_unique" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_progressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"tier" "tier",
	"band" text,
	"progresses_to" jsonb DEFAULT '[]'::jsonb,
	"lateral_moves" jsonb DEFAULT '[]'::jsonb,
	"growth_activity_ids" jsonb DEFAULT '[]'::jsonb,
	"readiness_signals" jsonb DEFAULT '[]'::jsonb,
	"development_areas" jsonb DEFAULT '[]'::jsonb,
	"risk_if_stagnant" text,
	"growth_track" "growth_track",
	"growth_track_notes" text,
	"autonomy" "autonomy_level",
	"mastery" text,
	"purpose" text,
	"job_characteristics" jsonb,
	"decision_rights" jsonb,
	"energised_by" jsonb DEFAULT '[]'::jsonb,
	"drained_by" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department" text NOT NULL,
	"job_title" text NOT NULL,
	"core_purpose" text,
	"key_deliverables" jsonb DEFAULT '[]'::jsonb,
	"strength_profile" jsonb DEFAULT '[]'::jsonb,
	"belbin_primary" text,
	"belbin_secondary" text,
	"tier" "tier",
	"budget_level" "budget_level" DEFAULT 'none' NOT NULL,
	"activities" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stage_role_unique" UNIQUE("stage_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"systems_owned" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"job_title" text NOT NULL,
	"color_index" integer DEFAULT 0 NOT NULL,
	"core_purpose" text,
	"cycle_position" text,
	"key_deliverables" jsonb DEFAULT '[]'::jsonb,
	"card_summary" text,
	"notes" text,
	"owns" jsonb DEFAULT '[]'::jsonb,
	"contributes_to" jsonb DEFAULT '[]'::jsonb,
	"does_not_own" jsonb DEFAULT '[]'::jsonb,
	"outputs" jsonb DEFAULT '[]'::jsonb,
	"strength_profile" jsonb DEFAULT '[]'::jsonb,
	"budget_level" "budget_level" DEFAULT 'none' NOT NULL,
	"budget_notes" text,
	"system_ownership" jsonb,
	"oversees_stage_ids" jsonb DEFAULT '[]'::jsonb,
	"belbin_primary" text,
	"belbin_secondary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"industry_template" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_assignments" ADD CONSTRAINT "activity_assignments_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_assignments" ADD CONSTRAINT "activity_assignments_role_id_team_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_conversations" ADD CONSTRAINT "forge_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_messages" ADD CONSTRAINT "forge_messages_conversation_id_forge_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."forge_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_from_stage_id_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_to_stage_id_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_progressions" ADD CONSTRAINT "role_progressions_role_id_team_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_role_assignments" ADD CONSTRAINT "stage_role_assignments_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_role_assignments" ADD CONSTRAINT "stage_role_assignments_role_id_team_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_roles" ADD CONSTRAINT "team_roles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_workspace" ON "activities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_activities_category" ON "activities" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_activity_assignments_activity" ON "activity_assignments" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_assignments_role" ON "activity_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_categories_workspace" ON "activity_categories" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_forge_convos_workspace" ON "forge_conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_forge_convos_user" ON "forge_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forge_messages_convo" ON "forge_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_handoffs_workspace" ON "handoffs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_org" ON "org_members" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_progressions_role" ON "role_progressions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_templates_dept" ON "role_templates" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_stage_assignments_stage" ON "stage_role_assignments" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "idx_stage_assignments_role" ON "stage_role_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_stages_workspace" ON "stages" USING btree ("workspace_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_roles_workspace" ON "team_roles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_org" ON "workspaces" USING btree ("org_id");
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ════════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════════

export const planEnum = pgEnum("plan", [
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const budgetLevelEnum = pgEnum("budget_level", [
  "owner",
  "manager",
  "awareness",
  "none",
]);

export const tierEnum = pgEnum("tier", [
  "entry",
  "mid",
  "senior",
  "lead",
  "head",
  "director",
]);

export const growthTrackEnum = pgEnum("growth_track", [
  "steep",
  "steady",
  "either",
]);

export const autonomyEnum = pgEnum("autonomy_level", [
  "low",
  "moderate",
  "high",
  "full",
]);

// ════════════════════════════════════════════
// MULTI-TENANT FOUNDATION
// ════════════════════════════════════════════

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(), // References Supabase auth.users
    role: orgRoleEnum("role").default("viewer").notNull(),
    invitedEmail: text("invited_email"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("org_user_unique").on(table.orgId, table.userId),
    index("idx_org_members_org").on(table.orgId),
    index("idx_org_members_user").on(table.userId),
  ]
);

// ════════════════════════════════════════════
// WORKSPACES
// ════════════════════════════════════════════

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    industryTemplate: text("industry_template"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_workspaces_org").on(table.orgId)]
);

// ════════════════════════════════════════════
// PIPELINE ARCHITECTURE
// ════════════════════════════════════════════

export const stages = pgTable(
  "stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    systemsOwned: jsonb("systems_owned").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_stages_workspace").on(table.workspaceId, table.sortOrder),
  ]
);

export const teamRoles = pgTable(
  "team_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),

    // Identity
    name: text("name").notNull(),
    jobTitle: text("job_title").notNull(),
    colorIndex: integer("color_index").default(0).notNull(),

    // Core definition
    corePurpose: text("core_purpose"),
    cyclePosition: text("cycle_position"),
    keyDeliverables: jsonb("key_deliverables").$type<string[]>().default([]),
    cardSummary: text("card_summary"),
    notes: text("notes"),

    // Ownership model
    owns: jsonb("owns")
      .$type<{ title: string; items: string[] }[]>()
      .default([]),
    contributesTo: jsonb("contributes_to").$type<string[]>().default([]),
    doesNotOwn: jsonb("does_not_own").$type<string[]>().default([]),
    outputs: jsonb("outputs").$type<string[]>().default([]),

    // Strength & budget
    strengthProfile: jsonb("strength_profile").$type<string[]>().default([]),
    budgetLevel: budgetLevelEnum("budget_level").default("none").notNull(),
    budgetNotes: text("budget_notes"),

    // System ownership
    systemOwnership: jsonb("system_ownership").$type<{
      primaryObject: string;
      objectDescription: string;
      ownsUntil: string;
      handsOffTo: string;
      handoffTrigger: string;
      whatLivesHere: { title: string; items: string[] }[];
      whatDoesNotLiveHere: string[];
    } | null>(),

    // Oversight (leadership roles)
    overseesStageIds: jsonb("oversees_stage_ids")
      .$type<string[]>()
      .default([]),

    // Belbin
    belbinPrimary: text("belbin_primary"),
    belbinSecondary: text("belbin_secondary"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_roles_workspace").on(table.workspaceId)]
);

export const stageRoleAssignments = pgTable(
  "stage_role_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .references(() => stages.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => teamRoles.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    unique("stage_role_unique").on(table.stageId, table.roleId),
    index("idx_stage_assignments_stage").on(table.stageId),
    index("idx_stage_assignments_role").on(table.roleId),
  ]
);

export const handoffs = pgTable(
  "handoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    fromStageId: uuid("from_stage_id")
      .references(() => stages.id, { onDelete: "cascade" })
      .notNull(),
    toStageId: uuid("to_stage_id")
      .references(() => stages.id, { onDelete: "cascade" })
      .notNull(),
    notes: text("notes"),
    tensions: jsonb("tensions").$type<string[]>().default([]),
    sla: text("sla"),
    slaOwner: text("sla_owner"),
    dataHandoff: text("data_handoff"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_handoffs_workspace").on(table.workspaceId)]
);

// ════════════════════════════════════════════
// ACTIVITY MANAGEMENT
// ════════════════════════════════════════════

export const activityCategories = pgTable(
  "activity_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    belbinIdeal: jsonb("belbin_ideal").$type<string[]>().default([]),
    belbinFitReason: text("belbin_fit_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_categories_workspace").on(table.workspaceId)]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => activityCategories.id),
    stageId: uuid("stage_id").references(() => stages.id),
    notes: text("notes"),
    // Change tracking: stores the state before current editing session
    preChangeSnapshot: jsonb("pre_change_snapshot").$type<{
      name: string;
      categoryId: string | null;
      stageId: string | null;
      notes: string | null;
      roleIds: string[];
    } | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_activities_workspace").on(table.workspaceId),
    index("idx_activities_category").on(table.categoryId),
  ]
);

export const activityAssignments = pgTable(
  "activity_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .references(() => activities.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => teamRoles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    unique("activity_role_unique").on(table.activityId, table.roleId),
    index("idx_activity_assignments_activity").on(table.activityId),
    index("idx_activity_assignments_role").on(table.roleId),
  ]
);

// ════════════════════════════════════════════
// CAREER PROGRESSION
// ════════════════════════════════════════════

export const roleProgressions = pgTable(
  "role_progressions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .references(() => teamRoles.id, { onDelete: "cascade" })
      .notNull(),

    // Tier & band
    tier: tierEnum("tier"),
    band: text("band"),

    // Career paths
    progressesTo: jsonb("progresses_to").$type<string[]>().default([]),
    lateralMoves: jsonb("lateral_moves").$type<string[]>().default([]),
    growthActivityIds: jsonb("growth_activity_ids")
      .$type<string[]>()
      .default([]),

    // Readiness & development
    readinessSignals: jsonb("readiness_signals").$type<string[]>().default([]),
    developmentAreas: jsonb("development_areas").$type<string[]>().default([]),
    riskIfStagnant: text("risk_if_stagnant"),

    // Framework 1: Radical Candor
    growthTrack: growthTrackEnum("growth_track"),
    growthTrackNotes: text("growth_track_notes"),

    // Framework 2: Drive (Daniel Pink)
    autonomy: autonomyEnum("autonomy"),
    mastery: text("mastery"),
    purpose: text("purpose"),

    // Framework 3: Job Characteristics (Hackman & Oldham)
    jobCharacteristics: jsonb("job_characteristics").$type<{
      skillVariety: "narrow" | "moderate" | "broad";
      taskIdentity: "partial" | "whole" | "system";
      taskSignificance: string;
      autonomyLevel: string;
      feedback: string;
    } | null>(),

    // Framework 4: RAPID (Bain)
    decisionRights: jsonb("decision_rights").$type<{
      decides: string[];
      recommends: string[];
      inputsTo: string[];
      performs: string[];
    } | null>(),

    // Framework 5: Working Genius (Lencioni)
    energisedBy: jsonb("energised_by").$type<string[]>().default([]),
    drainedBy: jsonb("drained_by").$type<string[]>().default([]),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_progressions_role").on(table.roleId)]
);

// ════════════════════════════════════════════
// RELATIONS
// ════════════════════════════════════════════

export const organisationsRelations = relations(organisations, ({ many }) => ({
  members: many(orgMembers),
  workspaces: many(workspaces),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [orgMembers.orgId],
    references: [organisations.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [workspaces.orgId],
    references: [organisations.id],
  }),
  stages: many(stages),
  teamRoles: many(teamRoles),
  handoffs: many(handoffs),
  activityCategories: many(activityCategories),
  activities: many(activities),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [stages.workspaceId],
    references: [workspaces.id],
  }),
  roleAssignments: many(stageRoleAssignments),
  handoffsFrom: many(handoffs, { relationName: "handoffFrom" }),
  handoffsTo: many(handoffs, { relationName: "handoffTo" }),
}));

export const teamRolesRelations = relations(teamRoles, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [teamRoles.workspaceId],
    references: [workspaces.id],
  }),
  stageAssignments: many(stageRoleAssignments),
  activityAssignments: many(activityAssignments),
  progression: many(roleProgressions),
}));

export const stageRoleAssignmentsRelations = relations(
  stageRoleAssignments,
  ({ one }) => ({
    stage: one(stages, {
      fields: [stageRoleAssignments.stageId],
      references: [stages.id],
    }),
    role: one(teamRoles, {
      fields: [stageRoleAssignments.roleId],
      references: [teamRoles.id],
    }),
  })
);

export const handoffsRelations = relations(handoffs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [handoffs.workspaceId],
    references: [workspaces.id],
  }),
  fromStage: one(stages, {
    fields: [handoffs.fromStageId],
    references: [stages.id],
    relationName: "handoffFrom",
  }),
  toStage: one(stages, {
    fields: [handoffs.toStageId],
    references: [stages.id],
    relationName: "handoffTo",
  }),
}));

export const activityCategoriesRelations = relations(
  activityCategories,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [activityCategories.workspaceId],
      references: [workspaces.id],
    }),
    activities: many(activities),
  })
);

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [activities.workspaceId],
    references: [workspaces.id],
  }),
  category: one(activityCategories, {
    fields: [activities.categoryId],
    references: [activityCategories.id],
  }),
  stage: one(stages, {
    fields: [activities.stageId],
    references: [stages.id],
  }),
  assignments: many(activityAssignments),
}));

export const activityAssignmentsRelations = relations(
  activityAssignments,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityAssignments.activityId],
      references: [activities.id],
    }),
    role: one(teamRoles, {
      fields: [activityAssignments.roleId],
      references: [teamRoles.id],
    }),
  })
);

export const roleProgressionsRelations = relations(
  roleProgressions,
  ({ one }) => ({
    role: one(teamRoles, {
      fields: [roleProgressions.roleId],
      references: [teamRoles.id],
    }),
  })
);

// ════════════════════════════════════════════
// GLOBAL ROLE & ACTIVITY TEMPLATES
// ════════════════════════════════════════════

export const roleTemplates = pgTable(
  "role_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    department: text("department").notNull(),
    jobTitle: text("job_title").notNull(),
    corePurpose: text("core_purpose"),
    keyDeliverables: jsonb("key_deliverables").$type<string[]>().default([]),
    strengthProfile: jsonb("strength_profile").$type<string[]>().default([]),
    belbinPrimary: text("belbin_primary"),
    belbinSecondary: text("belbin_secondary"),
    tier: tierEnum("tier"),
    budgetLevel: budgetLevelEnum("budget_level").default("none").notNull(),
    activities: jsonb("activities")
      .$type<{ category: string; items: string[] }[]>()
      .default([]),
    tags: jsonb("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_role_templates_dept").on(table.department),
  ]
);

// ════════════════════════════════════════════
// ROLE CLARITY BUILDER
// ════════════════════════════════════════════

export const claritySessionStatusEnum = pgEnum("clarity_session_status", [
  "draft",
  "analyzing",
  "compared",
  "resolved",
  "archived",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "pending",
  "accepted",
  "dismissed",
]);

export const proposalTypeEnum = pgEnum("proposal_type", [
  "edit_role",
  "add_ownership",
  "remove_ownership",
  "add_deliverable",
  "remove_deliverable",
  "set_boundary",
  "add_handoff_sla",
  "update_handoff_sla",
  "resolve_overlap",
]);

export const claritySessions = pgTable(
  "clarity_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    roleId: uuid("role_id").references(() => teamRoles.id, {
      onDelete: "set null",
    }),
    status: claritySessionStatusEnum("status").default("draft").notNull(),

    // Input: what the user provided
    inputType: text("input_type").notNull(), // "paste" | "url" | "manual"
    inputText: text("input_text"),
    inputUrl: text("input_url"),

    // AI-extracted expectations (from the job spec)
    extractedTitle: text("extracted_title"),
    extractedPurpose: text("extracted_purpose"),
    extractedResponsibilities: jsonb("extracted_responsibilities")
      .$type<{ text: string; raciType: string; frequency: string; isCore: boolean }[]>()
      .default([]),
    extractedDeliverables: jsonb("extracted_deliverables")
      .$type<{ text: string; measurable: boolean; suggestedMetric: string | null }[]>()
      .default([]),
    extractedOwnershipDomains: jsonb("extracted_ownership_domains")
      .$type<{ title: string; items: string[]; decisionRights: string }[]>()
      .default([]),
    extractedDoesNotOwn: jsonb("extracted_does_not_own")
      .$type<string[]>()
      .default([]),
    extractedContributesTo: jsonb("extracted_contributes_to")
      .$type<string[]>()
      .default([]),
    extractedSkills: jsonb("extracted_skills")
      .$type<{ text: string; category: string; required: boolean }[]>()
      .default([]),
    extractedTier: text("extracted_tier"),
    extractedAutonomyLevel: text("extracted_autonomy_level"),
    extractedSpanOfInfluence: text("extracted_span_of_influence"),
    extractedAmbiguities: jsonb("extracted_ambiguities")
      .$type<{ area: string; quote: string; risk: string; suggestedClarification: string }[]>()
      .default([]),
    extractedRedFlags: jsonb("extracted_red_flags")
      .$type<string[]>()
      .default([]),

    // Comparison results (AI-generated)
    comparisonSummary: text("comparison_summary"),
    gapAnalysis: jsonb("gap_analysis")
      .$type<
        {
          area: string;
          expected: string;
          current: string;
          severity: "high" | "medium" | "low";
          explanation: string;
        }[]
      >()
      .default([]),
    overlapAnalysis: jsonb("overlap_analysis")
      .$type<
        {
          item: string;
          currentOwner: string;
          expectedOwner: string;
          recommendation: string;
        }[]
      >()
      .default([]),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_clarity_sessions_workspace").on(table.workspaceId),
    index("idx_clarity_sessions_role").on(table.roleId),
    index("idx_clarity_sessions_user").on(table.userId),
  ]
);

export const clarityProposals = pgTable(
  "clarity_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => claritySessions.id, { onDelete: "cascade" })
      .notNull(),
    type: proposalTypeEnum("type").notNull(),
    status: proposalStatusEnum("status").default("pending").notNull(),

    // What the proposal changes
    targetRoleId: uuid("target_role_id").references(() => teamRoles.id, {
      onDelete: "cascade",
    }),
    targetHandoffId: uuid("target_handoff_id").references(() => handoffs.id, {
      onDelete: "cascade",
    }),

    // The change payload
    field: text("field"), // e.g. "corePurpose", "keyDeliverables", "owns"
    currentValue: jsonb("current_value").$type<unknown>(),
    proposedValue: jsonb("proposed_value").$type<unknown>(),

    // AI explanation
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    impact: text("impact"), // "high" | "medium" | "low"

    // Enriched AI metadata (effort, confidence, sequenceGroup, etc.)
    metadata: jsonb("metadata").$type<{
      effort?: string;
      confidence?: string;
      sequenceGroup?: number;
      reversible?: boolean;
      requiresConversation?: boolean;
      affectedRoles?: string[];
      doNothingCost?: string;
    }>(),

    // Who acted on it
    resolvedBy: uuid("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_clarity_proposals_session").on(table.sessionId),
    index("idx_clarity_proposals_role").on(table.targetRoleId),
  ]
);

export const clarityComments = pgTable(
  "clarity_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => claritySessions.id, { onDelete: "cascade" })
      .notNull(),
    proposalId: uuid("proposal_id").references(() => clarityProposals.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id").notNull(),
    userEmail: text("user_email"),
    content: text("content").notNull(),
    isApproval: integer("is_approval").default(0).notNull(), // 0=comment, 1=approve, -1=reject
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_clarity_comments_session").on(table.sessionId),
    index("idx_clarity_comments_proposal").on(table.proposalId),
  ]
);

// Clarity relations
export const claritySessionsRelations = relations(
  claritySessions,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [claritySessions.workspaceId],
      references: [workspaces.id],
    }),
    role: one(teamRoles, {
      fields: [claritySessions.roleId],
      references: [teamRoles.id],
    }),
    proposals: many(clarityProposals),
    comments: many(clarityComments),
  })
);

export const clarityProposalsRelations = relations(
  clarityProposals,
  ({ one, many }) => ({
    session: one(claritySessions, {
      fields: [clarityProposals.sessionId],
      references: [claritySessions.id],
    }),
    targetRole: one(teamRoles, {
      fields: [clarityProposals.targetRoleId],
      references: [teamRoles.id],
    }),
    comments: many(clarityComments),
  })
);

export const clarityCommentsRelations = relations(
  clarityComments,
  ({ one }) => ({
    session: one(claritySessions, {
      fields: [clarityComments.sessionId],
      references: [claritySessions.id],
    }),
    proposal: one(clarityProposals, {
      fields: [clarityComments.proposalId],
      references: [clarityProposals.id],
    }),
  })
);

// ════════════════════════════════════════════
// THE FORGE — AI CONVERSATIONS
// ════════════════════════════════════════════

export const forgeMessageRoleEnum = pgEnum("forge_message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);

export const forgeConversations = pgTable(
  "forge_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    title: text("title").default("New conversation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_forge_convos_workspace").on(table.workspaceId),
    index("idx_forge_convos_user").on(table.userId),
  ]
);

export const forgeMessages = pgTable(
  "forge_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => forgeConversations.id, { onDelete: "cascade" })
      .notNull(),
    role: forgeMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls").$type<Record<string, unknown>[]>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_forge_messages_convo").on(table.conversationId),
  ]
);

export const forgeConversationsRelations = relations(
  forgeConversations,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [forgeConversations.workspaceId],
      references: [workspaces.id],
    }),
    messages: many(forgeMessages),
  })
);

export const forgeMessagesRelations = relations(forgeMessages, ({ one }) => ({
  conversation: one(forgeConversations, {
    fields: [forgeMessages.conversationId],
    references: [forgeConversations.id],
  }),
}));

// ════════════════════════════════════════════
// AUDIT LOGS
// ════════════════════════════════════════════

export const auditActionEnum = pgEnum("audit_action", [
  "workspace.created",
  "workspace.updated",
  "workspace.deleted",
  "role.created",
  "role.updated",
  "role.deleted",
  "stage.created",
  "stage.updated",
  "stage.deleted",
  "stage.role_assigned",
  "stage.role_unassigned",
  "handoff.created",
  "handoff.updated",
  "handoff.deleted",
  "activity.created",
  "activity.updated",
  "activity.deleted",
  "activity.assigned",
  "activity.unassigned",
  "activity_category.created",
  "activity_category.updated",
  "activity_category.deleted",
  "progression.created",
  "progression.updated",
  "progression.deleted",
  "org.created",
  "org.updated",
  "org.member_invited",
  "org.member_removed",
  "org.member_role_changed",
  "auth.login",
  "auth.logout",
  "auth.failed_login",
  "billing.plan_changed",
  "billing.payment_succeeded",
  "billing.payment_failed",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    userEmail: text("user_email"),
    orgId: uuid("org_id").references(() => organisations.id, { onDelete: "set null" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    action: auditActionEnum("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
    newState: jsonb("new_state").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
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

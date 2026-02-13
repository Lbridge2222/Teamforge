// ════════════════════════════════════════════
// Domain Types — inferred from Drizzle schema
// ════════════════════════════════════════════

import type {
  organisations,
  orgMembers,
  workspaces,
  stages,
  teamRoles,
  stageRoleAssignments,
  handoffs,
  activityCategories,
  activities,
  activityAssignments,
  roleProgressions,
  forgeConversations,
  forgeMessages,
  claritySessions,
  clarityProposals,
  clarityComments,
} from "@/lib/db/schema";

// Drizzle inferred types
export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;

export type OrgMember = typeof orgMembers.$inferSelect;
export type NewOrgMember = typeof orgMembers.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;

export type TeamRole = typeof teamRoles.$inferSelect;
export type NewTeamRole = typeof teamRoles.$inferInsert;

export type StageRoleAssignment = typeof stageRoleAssignments.$inferSelect;
export type NewStageRoleAssignment = typeof stageRoleAssignments.$inferInsert;

export type Handoff = typeof handoffs.$inferSelect;
export type NewHandoff = typeof handoffs.$inferInsert;

export type ActivityCategory = typeof activityCategories.$inferSelect;
export type NewActivityCategory = typeof activityCategories.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type ActivityAssignment = typeof activityAssignments.$inferSelect;
export type NewActivityAssignment = typeof activityAssignments.$inferInsert;

export type RoleProgression = typeof roleProgressions.$inferSelect;
export type NewRoleProgression = typeof roleProgressions.$inferInsert;

// Forge AI
export type ForgeConversation = typeof forgeConversations.$inferSelect;
export type NewForgeConversation = typeof forgeConversations.$inferInsert;

export type ForgeMessage = typeof forgeMessages.$inferSelect;
export type NewForgeMessage = typeof forgeMessages.$inferInsert;

export type ForgeMessageRole = "user" | "assistant" | "system" | "tool";

// Clarity Builder
export type ClaritySession = typeof claritySessions.$inferSelect;
export type NewClaritySession = typeof claritySessions.$inferInsert;

export type ClarityProposal = typeof clarityProposals.$inferSelect;
export type NewClarityProposal = typeof clarityProposals.$inferInsert;

export type ClarityComment = typeof clarityComments.$inferSelect;
export type NewClarityComment = typeof clarityComments.$inferInsert;

export type ClaritySessionStatus =
  | "draft"
  | "analyzing"
  | "compared"
  | "resolved"
  | "archived";
export type ProposalStatus = "pending" | "accepted" | "dismissed";
export type ProposalType =
  | "edit_role"
  | "add_ownership"
  | "remove_ownership"
  | "add_deliverable"
  | "remove_deliverable"
  | "set_boundary"
  | "add_handoff_sla"
  | "update_handoff_sla"
  | "resolve_overlap";

export type GapAnalysisItem = {
  area: string;
  expected: string;
  current: string;
  severity: "high" | "medium" | "low";
  explanation: string;
  category?: string;
  riskStatement?: string;
  affectedParties?: string[];
};

export type OverlapAnalysisItem = {
  item: string;
  currentOwner: string;
  expectedOwner: string;
  recommendation: string;
  overlapType?: string;
};

export type ClaritySessionWithDetails = ClaritySession & {
  proposals: ClarityProposal[];
  comments: ClarityComment[];
  role: TeamRole | null;
};

// ════════════════════════════════════════════
// Sub-structures
// ════════════════════════════════════════════

export type OwnershipCategory = {
  title: string;
  items: string[];
};

export type SystemOwnership = {
  primaryObject: string;
  objectDescription: string;
  ownsUntil: string;
  handsOffTo: string;
  handoffTrigger: string;
  whatLivesHere: OwnershipCategory[];
  whatDoesNotLiveHere: string[];
};

export type JobCharacteristics = {
  skillVariety: "narrow" | "moderate" | "broad";
  taskIdentity: "partial" | "whole" | "system";
  taskSignificance: string;
  autonomyLevel: string;
  feedback: string;
};

export type DecisionRights = {
  decides: string[];
  recommends: string[];
  inputsTo: string[];
  performs: string[];
};

// ════════════════════════════════════════════
// Plan & Role Enums
// ════════════════════════════════════════════

export type Plan = "free" | "starter" | "pro" | "enterprise";
export type OrgRole = "owner" | "admin" | "editor" | "viewer";
export type BudgetLevel = "owner" | "manager" | "awareness" | "none";
export type Tier = "entry" | "mid" | "senior" | "lead" | "head" | "director";
export type GrowthTrack = "steep" | "steady" | "either";
export type AutonomyLevel = "low" | "moderate" | "high" | "full";

// ════════════════════════════════════════════
// Rich / Joined Types (for UI usage)
// ════════════════════════════════════════════

export type StageWithRoles = Stage & {
  roles: TeamRole[];
};

export type WorkspaceData = {
  workspace: Workspace;
  stages: StageWithRoles[];
  roles: TeamRole[];
  handoffs: (Handoff & { fromStage: Stage; toStage: Stage })[];
  activityCategories: ActivityCategory[];
  activities: (Activity & { assignments: ActivityAssignment[] })[];
  progressions: RoleProgression[];
  stageAssignments: StageRoleAssignment[];
};

// ════════════════════════════════════════════
// Plan Limits
// ════════════════════════════════════════════

export const PLAN_LIMITS: Record<
  Plan,
  {
    workspaces: number;
    rolesPerWorkspace: number;
    activitiesPerWorkspace: number;
    orgMembers: number;
    aiFeatures: boolean;
    exportPdf: boolean;
    apiAccess: boolean;
  }
> = {
  free: {
    workspaces: 1,
    rolesPerWorkspace: 5,
    activitiesPerWorkspace: 20,
    orgMembers: 1,
    aiFeatures: false,
    exportPdf: false,
    apiAccess: false,
  },
  starter: {
    workspaces: 3,
    rolesPerWorkspace: 20,
    activitiesPerWorkspace: 100,
    orgMembers: 5,
    aiFeatures: false,
    exportPdf: true,
    apiAccess: false,
  },
  pro: {
    workspaces: Infinity,
    rolesPerWorkspace: Infinity,
    activitiesPerWorkspace: Infinity,
    orgMembers: 20,
    aiFeatures: true,
    exportPdf: true,
    apiAccess: false,
  },
  enterprise: {
    workspaces: Infinity,
    rolesPerWorkspace: Infinity,
    activitiesPerWorkspace: Infinity,
    orgMembers: Infinity,
    aiFeatures: true,
    exportPdf: true,
    apiAccess: true,
  },
};

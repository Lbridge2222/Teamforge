// ════════════════════════════════════════════
// Request Validation Schemas
// Using Zod for runtime type safety and validation
// ════════════════════════════════════════════

import { z } from "zod";

// ════════════════════════════════════════════
// COMMON SCHEMAS
// ════════════════════════════════════════════

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ════════════════════════════════════════════
// WORKSPACE SCHEMAS
// ════════════════════════════════════════════

export const createWorkspaceSchema = z.object({
  orgId: uuidSchema,
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  template: z.string().max(50).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  industryTemplate: z.string().max(50).optional(),
});

// ════════════════════════════════════════════
// ROLE SCHEMAS
// ════════════════════════════════════════════

export const budgetLevelSchema = z.enum(["owner", "manager", "awareness", "none"]);
export const tierSchema = z.enum(["entry", "mid", "senior", "lead", "head", "director"]);

export const strengthProfileItemSchema = z.string().min(1).max(100);
export const deliverableSchema = z.string().min(1).max(500);

export const createRoleSchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(100).trim(),
  jobTitle: z.string().min(1).max(100).trim(),
  corePurpose: z.string().max(1000).optional(),
  cyclePosition: z.string().max(500).optional(),
  keyDeliverables: z.array(deliverableSchema).max(20).default([]),
  cardSummary: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  colorIndex: z.number().int().min(0).max(20).default(0),
  budgetLevel: budgetLevelSchema.default("none"),
  budgetNotes: z.string().max(1000).optional(),
  strengthProfile: z.array(strengthProfileItemSchema).max(10).default([]),
  belbinPrimary: z.string().max(50).optional(),
  belbinSecondary: z.string().max(50).optional(),
});

export const updateRoleSchema = createRoleSchema.partial().omit({ workspaceId: true });

// ════════════════════════════════════════════
// STAGE SCHEMAS
// ════════════════════════════════════════════

export const createStageSchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(100).trim(),
  sortOrder: z.number().int().min(0).default(0),
  systemsOwned: z.array(z.string().max(100)).max(50).default([]),
});

export const updateStageSchema = createStageSchema.partial().omit({ workspaceId: true });

export const assignStageRoleSchema = z.object({
  roleId: uuidSchema,
  sortOrder: z.number().int().min(0).default(0),
});

export const unassignStageRoleSchema = z.object({
  roleId: uuidSchema,
});

// ════════════════════════════════════════════
// HANDOFF SCHEMAS
// ════════════════════════════════════════════

export const createHandoffSchema = z.object({
  workspaceId: uuidSchema,
  fromStageId: uuidSchema,
  toStageId: uuidSchema,
  notes: z.string().max(2000).optional(),
  tensions: z.array(z.string().max(500)).max(20).default([]),
  sla: z.string().max(200).optional(),
  slaOwner: z.string().max(100).optional(),
  dataHandoff: z.string().max(500).optional(),
}).refine((data) => data.fromStageId !== data.toStageId, {
  message: "fromStageId and toStageId must be different",
  path: ["toStageId"],
});

export const updateHandoffSchema = z.object({
  fromStageId: uuidSchema.optional(),
  toStageId: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  tensions: z.array(z.string().max(500)).max(20).optional(),
  sla: z.string().max(200).optional(),
  slaOwner: z.string().max(100).optional(),
  dataHandoff: z.string().max(500).optional(),
});

// ════════════════════════════════════════════
// ACTIVITY SCHEMAS
// ════════════════════════════════════════════

export const createActivityCategorySchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(100).trim(),
  sortOrder: z.number().int().min(0).default(0),
  belbinIdeal: z.array(z.string().max(50)).max(10).default([]),
  belbinFitReason: z.string().max(1000).optional(),
});

export const updateActivityCategorySchema = createActivityCategorySchema.partial().omit({ workspaceId: true });

export const createActivitySchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(200).trim(),
  categoryId: uuidSchema.optional(),
  stageId: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  roleIds: z.array(uuidSchema).max(50).default([]),
});

export const updateActivitySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  categoryId: uuidSchema.nullable().optional(),
  stageId: uuidSchema.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  roleIds: z.array(uuidSchema).max(50).optional(),
});

// ════════════════════════════════════════════
// PROGRESSION SCHEMAS
// ════════════════════════════════════════════

export const growthTrackSchema = z.enum(["steep", "steady", "either"]);
export const autonomySchema = z.enum(["low", "moderate", "high", "full"]);

export const createProgressionSchema = z.object({
  roleId: uuidSchema,
  tier: tierSchema.optional(),
  band: z.string().max(50).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  growthTrack: growthTrackSchema.optional(),
  salary: z.number().int().min(0).max(10000000).optional(),
  salaryNote: z.string().max(200).optional(),
  autonomyLevel: autonomySchema.optional(),
  impactScope: z.string().max(500).optional(),
  nextStep: z.string().max(200).optional(),
  stretchGap: z.string().max(1000).optional(),
});

export const updateProgressionSchema = createProgressionSchema.partial().omit({ roleId: true });

// ════════════════════════════════════════════
// FORGE SCHEMAS
// ════════════════════════════════════════════

export const forgeChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000).trim(),
});

export const forgeChatRequestSchema = z.object({
  workspaceId: uuidSchema,
  conversationId: uuidSchema.optional(),
  messages: z.array(forgeChatMessageSchema).min(1).max(50),
});

// ════════════════════════════════════════════
// ORG & MEMBER SCHEMAS
// ════════════════════════════════════════════

export const orgRoleSchema = z.enum(["viewer", "editor", "admin", "owner"]);

export const createOrgSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const updateOrgMemberRoleSchema = z.object({
  role: orgRoleSchema,
});

export const inviteMemberSchema = z.object({
  email: z.string().email().max(255),
  role: orgRoleSchema.default("viewer"),
});

// ════════════════════════════════════════════
// TEMPLATE SCHEMAS
// ════════════════════════════════════════════

export const importTemplatesSchema = z.object({
  workspaceId: uuidSchema,
  templateIds: z.array(uuidSchema).min(1).max(20),
});

// ════════════════════════════════════════════
// BILLING SCHEMAS
// ════════════════════════════════════════════

export const planSchema = z.enum(["free", "starter", "pro", "enterprise"]);

export const createCheckoutSchema = z.object({
  plan: planSchema,
  annual: z.boolean().default(false),
});

// ════════════════════════════════════════════
// CLARITY BUILDER SCHEMAS
// ════════════════════════════════════════════

export const createClaritySessionSchema = z.object({
  workspaceId: uuidSchema,
  roleId: uuidSchema.optional(),
  inputType: z.enum(["paste", "url", "manual"]),
  inputText: z.string().max(20000).optional(),
  inputUrl: z.string().url().max(2000).optional(),
}).refine(
  (data) => data.inputType === "manual" || data.inputText || data.inputUrl,
  { message: "Either inputText or inputUrl is required for non-manual sessions" }
);

export const compareClaritySessionSchema = z.object({
  roleId: uuidSchema,
});

export const updateProposalStatusSchema = z.object({
  status: z.enum(["accepted", "dismissed"]),
});

export const createClarityCommentSchema = z.object({
  proposalId: uuidSchema.optional(),
  content: z.string().min(1).max(2000).trim(),
  isApproval: z.number().int().min(-1).max(1).default(0),
});

export const detectOverlapsSchema = z.object({
  workspaceId: uuidSchema,
});

export const suggestHandoffsSchema = z.object({
  workspaceId: uuidSchema,
});

// ════════════════════════════════════════════
// VALIDATION HELPER TYPES
// ════════════════════════════════════════════

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateHandoffInput = z.infer<typeof createHandoffSchema>;
export type UpdateHandoffInput = z.infer<typeof updateHandoffSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ForgeChatRequest = z.infer<typeof forgeChatRequestSchema>;

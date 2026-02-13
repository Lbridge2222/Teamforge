// ════════════════════════════════════════════
// The Forge — AI Tool Definitions (AI SDK v6)
// ════════════════════════════════════════════

import { z } from "zod";
import { tool } from "ai";
import {
  executeCreateRole,
  executeUpdateRole,
  executeCreateStage,
  executeAssignRoleToStage,
  executeCreateActivity,
  executeCreateCategory,
  executeCreateHandoff,
  executeAnalyseWorkspace,
  executeSearchRoleOnline,
  executeSuggestStructure,
} from "./tool-executors";

// ── Tool Factory ──

export function createForgeTools(workspaceId: string, wsData: any) {
  return {
    create_role: tool({
      description:
        "Create a new team role in the workspace. Use this when the user wants to add a role, position, or team member definition.",
      inputSchema: z.object({
        name: z.string().describe("Internal name/slug for the role"),
        jobTitle: z.string().describe("Human-readable job title"),
        corePurpose: z.string().optional().describe("One-line purpose statement"),
        keyDeliverables: z.array(z.string()).optional().describe("Key deliverables"),
        belbinPrimary: z.string().optional().describe("Primary Belbin team role key"),
        belbinSecondary: z.string().optional().describe("Secondary Belbin team role key"),
        budgetLevel: z.enum(["owner", "manager", "awareness", "none"]).optional(),
        colorIndex: z.number().optional().describe("Color index 0-7"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeCreateRole(workspaceId, input),
    }),

    update_role: tool({  
      description:
        "Update an existing role's properties. Use this when the user wants to modify a role that already exists.",
      inputSchema: z.object({
        roleId: z.string().describe("The ID of the role to update"),
        name: z.string().optional().describe("Internal name/slug for the role"),
        jobTitle: z.string().optional().describe("Human-readable job title"),
        corePurpose: z.string().optional().describe("One-line purpose statement"),
        keyDeliverables: z.array(z.string()).optional().describe("Key deliverables"),
        belbinPrimary: z.string().optional().describe("Primary Belbin team role key"),
        belbinSecondary: z.string().optional().describe("Secondary Belbin team role key"),
        budgetLevel: z.enum(["owner", "manager", "awareness", "none"]).optional(),
        colorIndex: z.number().optional().describe("Color index 0-7"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeUpdateRole(input),
    }),

    create_stage: tool({
      description: "Create a new pipeline stage in the workspace.",
      inputSchema: z.object({
        name: z.string().describe("Name of the stage"),
        sortOrder: z.number().optional().describe("Position in the pipeline (0-based)"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeCreateStage(workspaceId, input),
    }),

    assign_role_to_stage: tool({
      description: "Assign an existing role to a pipeline stage.",
      inputSchema: z.object({
        roleId: z.string().describe("The ID of the role to assign"),
        stageId: z.string().describe("The ID of the stage"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeAssignRoleToStage(input),
    }),

    create_activity: tool({
      description: "Create a new activity (work item) in the workspace.",
      inputSchema: z.object({
        name: z.string().describe("Name of the activity"),
        categoryId: z.string().optional().describe("Category ID"),
        stageId: z.string().optional().describe("Stage ID"),
        notes: z.string().optional().describe("Notes"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeCreateActivity(workspaceId, input),
    }),

    create_category: tool({
      description: "Create a new activity category.",
      inputSchema: z.object({
        name: z.string().describe("Name of the category"),
        belbinIdeal: z.array(z.string()).optional().describe("Ideal Belbin types"),
        belbinFitReason: z.string().optional().describe("Reason for Belbin fit"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeCreateCategory(workspaceId, input),
    }),

    create_handoff: tool({
      description: "Create a handoff zone between two pipeline stages.",
      inputSchema: z.object({
        fromStageId: z.string().describe("Source stage ID"),
        toStageId: z.string().describe("Destination stage ID"),
        notes: z.string().optional().describe("Handoff notes"),
        sla: z.string().optional().describe("SLA for this handoff"),
        tensions: z.array(z.string()).optional().describe("Known tensions"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeCreateHandoff(workspaceId, input),
    }),

    analyse_workspace: tool({
      description:
        "Run diagnostic analysis on the workspace: gaps, overlaps, Belbin, health, boundaries.",
      inputSchema: z.object({
        focusArea: z
          .enum(["full", "gaps", "overlaps", "belbin", "health", "boundaries", "career"])
          .optional(),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeAnalyseWorkspace(wsData, input.focusArea),
    }),

    search_role_online: tool({
      description: "Search the internet for job role descriptions and market data.",
      inputSchema: z.object({
        query: z.string().describe("Search query for the job role"),
        industry: z.string().optional().describe("Industry context"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeSearchRoleOnline(input),
    }),

    suggest_structure: tool({
      description:
        "Generate a suggested team/org structure based on a business description.",
      inputSchema: z.object({
        businessDescription: z.string().describe("Description of the business"),
        teamSize: z.number().optional().describe("Approximate team size"),
        industry: z.string().optional().describe("Industry sector"),
      }),
      outputSchema: z.any(),
      execute: async (input) => executeSuggestStructure(input),
    }),
  };
}

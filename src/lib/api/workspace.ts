// ════════════════════════════════════════════
// Workspace API — typed methods for workspace operations
// ════════════════════════════════════════════

import { apiClient, type ApiResponse, type WorkspaceData } from "./client";
import type { Workspace, Stage, TeamRole } from "@/lib/types";

// ════════════════════════════════════════════
// Workspace operations
// ════════════════════════════════════════════

export const workspaceApi = {
  /**
   * Get full workspace data
   */
  async getWorkspace(workspaceId: string): Promise<ApiResponse<WorkspaceData>> {
    return apiClient.get<WorkspaceData>(`/workspaces/${workspaceId}`);
  },

  /**
   * Update workspace metadata
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): Promise<ApiResponse<{ workspace: Workspace }>> {
    return apiClient.put(`/workspaces/${workspaceId}`, updates);
  },

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/workspaces/${workspaceId}`);
  },

  /**
   * List all workspaces for current user
   */
  async listWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[] }>> {
    return apiClient.get("/workspaces");
  },

  /**
   * Create new workspace
   */
  async createWorkspace(data: {
    name: string;
    description?: string;
    orgId: string;
  }): Promise<ApiResponse<{ workspace: Workspace }>> {
    return apiClient.post("/workspaces", data);
  },
};

// ════════════════════════════════════════════
// Stage operations
// ════════════════════════════════════════════

export const stageApi = {
  /**
   * Create stage
   */
  async createStage(
    workspaceId: string,
    data: { name: string; sortOrder: number }
  ): Promise<ApiResponse<{ stage: Stage }>> {
    return apiClient.post(`/workspaces/${workspaceId}/stages`, data);
  },

  /**
   * Update stage
   */
  async updateStage(
    stageId: string,
    updates: Partial<Stage>
  ): Promise<ApiResponse<{ stage: Stage }>> {
    return apiClient.put(`/stages/${stageId}`, updates);
  },

  /**
   * Delete stage
   */
  async deleteStage(stageId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/stages/${stageId}`);
  },

  /**
   * Assign role to stage
   */
  async assignRole(
    stageId: string,
    roleId: string
  ): Promise<ApiResponse<{ assignment: { id: string; stageId: string; roleId: string } }>> {
    return apiClient.post(`/stages/${stageId}/assign`, { roleId });
  },

  /**
   * Unassign role from stage
   */
  async unassignRole(
    stageId: string,
    roleId: string
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/stages/${stageId}/assign`, { roleId });
  },
};

// ════════════════════════════════════════════
// Role operations
// ════════════════════════════════════════════

export const roleApi = {
  /**
   * Create role
   */
  async createRole(data: {
    workspaceId: string;
    name: string;
    jobTitle: string;
    corePurpose?: string;
    keyDeliverables?: string[];
    belbinPrimary?: string;
    belbinSecondary?: string;
    [key: string]: unknown;
  }): Promise<ApiResponse<{ role: TeamRole }>> {
    return apiClient.post(`/workspaces/${data.workspaceId}/roles`, data);
  },

  /**
   * Update role
   */
  async updateRole(
    roleId: string,
    updates: Partial<TeamRole>
  ): Promise<ApiResponse<{ role: TeamRole }>> {
    return apiClient.put(`/roles/${roleId}`, updates);
  },

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/roles/${roleId}`);
  },
};

// ════════════════════════════════════════════
// Handoff operations
// ════════════════════════════════════════════

export const handoffApi = {
  /**
   * Create handoff
   */
  async createHandoff(
    workspaceId: string,
    data: { fromStageId: string; toStageId: string; sla?: string; contract?: string }
  ): Promise<ApiResponse<{ handoff: { id: string } }>> {
    return apiClient.post(`/workspaces/${workspaceId}/handoffs`, data);
  },

  /**
   * Update handoff
   */
  async updateHandoff(
    handoffId: string,
    updates: { sla?: string; contract?: string }
  ): Promise<ApiResponse<{ handoff: { id: string } }>> {
    return apiClient.put(`/handoffs/${handoffId}`, updates);
  },

  /**
   * Delete handoff
   */
  async deleteHandoff(handoffId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/handoffs/${handoffId}`);
  },
};

// ════════════════════════════════════════════
// Activity operations
// ════════════════════════════════════════════

export const activityApi = {
  /**
   * Create activity category
   */
  async createCategory(
    workspaceId: string,
    data: { name: string; sortOrder?: number }
  ): Promise<ApiResponse<{ category: { id: string; name: string } }>> {
    return apiClient.post(`/workspaces/${workspaceId}/categories`, data);
  },

  /**
   * Update activity category
   */
  async updateCategory(
    categoryId: string,
    updates: { name?: string; sortOrder?: number }
  ): Promise<ApiResponse<{ category: { id: string } }>> {
    return apiClient.put(`/categories/${categoryId}`, updates);
  },

  /**
   * Delete activity category
   */
  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/categories/${categoryId}`);
  },

  /**
   * Create activity
   */
  async createActivity(
    workspaceId: string,
    data: { name: string; categoryId?: string; estimatedFte?: number }
  ): Promise<ApiResponse<{ activity: { id: string } }>> {
    return apiClient.post(`/workspaces/${workspaceId}/activities`, data);
  },

  /**
   * Update activity
   */
  async updateActivity(
    activityId: string,
    updates: { name?: string; categoryId?: string; estimatedFte?: number }
  ): Promise<ApiResponse<{ activity: { id: string } }>> {
    return apiClient.put(`/activities/${activityId}`, updates);
  },

  /**
   * Delete activity
   */
  async deleteActivity(activityId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/activities/${activityId}`);
  },

  /**
   * Assign activity to roles
   */
  async assignToRoles(
    activityId: string,
    roleIds: string[]
  ): Promise<ApiResponse<{ assignments: { id: string }[] }>> {
    return apiClient.post(`/activities/${activityId}/assign`, { roleIds });
  },
};

// ════════════════════════════════════════════
// Progression operations
// ════════════════════════════════════════════

export const progressionApi = {
  /**
   * Create progression
   */
  async createProgression(data: {
    roleId: string;
    tier?: string;
    growthTrack?: string;
    [key: string]: unknown;
  }): Promise<ApiResponse<{ progression: { id: string } }>> {
    return apiClient.post(`/progressions`, data);
  },

  /**
   * Update progression
   */
  async updateProgression(
    progressionId: string,
    updates: { tier?: string; growthTrack?: string; [key: string]: unknown }
  ): Promise<ApiResponse<{ progression: { id: string } }>> {
    return apiClient.put(`/progressions/${progressionId}`, updates);
  },

  /**
   * Delete progression
   */
  async deleteProgression(progressionId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/progressions/${progressionId}`);
  },
};

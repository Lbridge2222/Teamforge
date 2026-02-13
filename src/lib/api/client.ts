// ════════════════════════════════════════════
// API Client — Centralized API layer with type safety
// ════════════════════════════════════════════

import type {
  Workspace,
  Stage,
  TeamRole,
  Handoff,
  ActivityCategory,
  Activity,
  ActivityAssignment,
  StageRoleAssignment,
  RoleProgression,
} from "@/lib/types";

// ════════════════════════════════════════════
// Core Types
// ════════════════════════════════════════════

export type ApiError = {
  message: string;
  status: number;
  code?: string;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export type WorkspaceData = {
  workspace: Workspace;
  stages: Stage[];
  roles: TeamRole[];
  handoffs: Handoff[];
  categories: ActivityCategory[];
  activities: Activity[];
  activityAssignments: ActivityAssignment[];
  stageAssignments: StageRoleAssignment[];
  progressions: RoleProgression[];
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

// ════════════════════════════════════════════
// Low-level API utilities
// ════════════════════════════════════════════

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            message: errorData.error || "Request failed",
            status: response.status,
            code: errorData.code,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Network error",
          status: 0,
        },
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// ════════════════════════════════════════════
// Singleton instance
// ════════════════════════════════════════════

export const apiClient = new ApiClient();

// ════════════════════════════════════════════
// Helper: unwrap response or throw
// ════════════════════════════════════════════

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error.message);
  }
  return response.data;
}

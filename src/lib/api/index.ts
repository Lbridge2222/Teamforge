// ════════════════════════════════════════════
// API Client — Exports
// ════════════════════════════════════════════

export { apiClient, unwrapResponse } from "./client";
export type {
  ApiError,
  ApiResponse,
  WorkspaceData,
  PaginationParams,
  PaginatedResponse,
} from "./client";

export {
  workspaceApi,
  stageApi,
  roleApi,
  handoffApi,
  activityApi,
  progressionApi,
} from "./workspace";

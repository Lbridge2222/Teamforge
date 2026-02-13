// ════════════════════════════════════════════
// Workspace Configuration — Configurable limits and settings
// ════════════════════════════════════════════

/**
 * Performance and scaling configuration
 */
export const WORKSPACE_CONFIG = {
  /**
   * Maximum number of entities to load before switching to pagination
   */
  MAX_INLINE_LOAD: {
    roles: 100,
    activities: 200,
    stages: 50,
  },

  /**
   * Default pagination limits
   */
  PAGINATION: {
    defaultLimit: 50,
    maxLimit: 200,
  },

  /**
   * Cache configuration
   */
  CACHE: {
    // Time before data is considered stale (ms)
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Time before cache is garbage collected (ms)
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },

  /**
   * Forge chat configuration
   */
  FORGE: {
    // Maximum tokens in workspace context
    maxContextTokens: 8000,
    // Maximum messages in conversation history
    maxConversationHistory: 50,
    // Stream chunk size
    streamChunkSize: 1024,
  },
} as const;

/**
 * Feature flags for progressive enhancement
 */
export const FEATURE_FLAGS = {
  enablePagination: true,
  enableVirtualization: false, // TODO: Implement
  enableAuditLog: false, // TODO: Implement
  enableRLS: false, // TODO: Implement with Supabase RLS
  enableWebSockets: false, // TODO: Add real-time updates
} as const;

/**
 * Check if workspace should use paginated loading
 */
export function shouldUsePaginatedLoad(counts: {
  roles?: number;
  activities?: number;
  stages?: number;
}): boolean {
  if (!FEATURE_FLAGS.enablePagination) return false;

  return (
    (counts.roles || 0) > WORKSPACE_CONFIG.MAX_INLINE_LOAD.roles ||
    (counts.activities || 0) > WORKSPACE_CONFIG.MAX_INLINE_LOAD.activities ||
    (counts.stages || 0) > WORKSPACE_CONFIG.MAX_INLINE_LOAD.stages
  );
}
